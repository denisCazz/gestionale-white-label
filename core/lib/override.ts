/**
 * Client override resolver.
 *
 * Pattern white-label per personalizzare comportamento per singolo cliente
 * senza toccare il core. Mirror della struttura `core/` dentro
 * `client/<slug>/overrides/` e questo helper risolve il file giusto.
 *
 * Uso (component override):
 *
 *   const Comp = await loadOverride<typeof DefaultComponent>(
 *     "components/dashboard/welcome",
 *     slug,
 *     () => import("@core/components/dashboard/welcome"),
 *   );
 *
 * Per nuovo cliente custom:
 *   1. clone repo
 *   2. crea cartella `client/<slug>/overrides/components/dashboard/welcome.tsx`
 *   3. esporta default override component
 *   4. il loader lo trova automaticamente (fallback a core)
 *
 * NOTA: il dynamic import richiede percorsi statici per Next.js bundling.
 * Per override frequenti, registra esplicitamente i moduli in `client/<slug>/index.ts`
 * e usa `getClientRegistry(slug)` invece di import dinamici.
 */

export type OverrideRegistry = Record<string, () => Promise<unknown>>;

const _clientRegistries = new Map<string, OverrideRegistry>();

/**
 * Registra a startup gli override per uno slug cliente.
 * Da chiamare in `client/<slug>/index.ts`:
 *
 *   import { registerClientOverrides } from "@core/lib/override";
 *   registerClientOverrides("bar-mario", {
 *     "components/dashboard/welcome": () => import("./overrides/components/dashboard/welcome"),
 *   });
 */
export function registerClientOverrides(slug: string, registry: OverrideRegistry) {
  _clientRegistries.set(slug, registry);
}

export async function loadOverride<T>(
  key: string,
  slug: string,
  fallback: () => Promise<{ default: T }>
): Promise<T> {
  const reg = _clientRegistries.get(slug);
  if (reg && reg[key]) {
    const mod = (await reg[key]()) as { default: T };
    return mod.default;
  }
  const mod = await fallback();
  return mod.default;
}

export function hasOverride(slug: string, key: string): boolean {
  const reg = _clientRegistries.get(slug);
  return !!(reg && reg[key]);
}
