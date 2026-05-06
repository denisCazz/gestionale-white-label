# Client Overrides

Questa cartella contiene personalizzazioni di codice per singoli clienti.

## Struttura

```
client/
├── README.md           # questo file
└── <slug>/             # uno per cliente custom (es. "bar-mario")
    ├── index.ts        # registra gli override
    └── overrides/      # mirror della struttura `core/`
        ├── components/
        ├── modules/
        └── ...
```

## Personalizzazioni DB-driven (no code)

La maggior parte delle personalizzazioni si fa **da DB**, senza toccare il codice:

- **Branding**: logo, colori, ragione sociale → tabella `Client`
- **Moduli attivi**: tabella `ClientModule`
- **Lingua/valuta**: campi `Client.locale`, `Client.currency`
- **Utenti e ruoli**: tabella `User`
- **Catalogo prodotti**: tutto

Per questi casi non serve clonare il repo: si gestisce dal pannello super-admin.

## Personalizzazioni di codice (override)

Solo quando un cliente vuole una **funzionalità custom** non gestibile da config DB:

### 1. Clone del repo per il cliente

```bash
git clone <template-repo> gestionale-bar-mario
cd gestionale-bar-mario
git checkout -b client/bar-mario
```

### 2. Crea cartella override

```bash
mkdir -p client/bar-mario/overrides/components/dashboard
```

### 3. Crea il componente override (mirror del path core)

```tsx
// client/bar-mario/overrides/components/dashboard/welcome.tsx
export default function WelcomeBanner() {
  return <div>Benvenuto da Bar Mario!</div>;
}
```

### 4. Registra l'override

```ts
// client/bar-mario/index.ts
import { registerClientOverrides } from "@core/lib/override";

registerClientOverrides("bar-mario", {
  "components/dashboard/welcome": () => import("./overrides/components/dashboard/welcome"),
});
```

### 5. Importa il registry all'avvio

In `app/layout.tsx` o in un file di startup:

```ts
import "@client/bar-mario";
```

### 6. Usa l'override nel core

```tsx
import { loadOverride } from "@core/lib/override";

const Welcome = await loadOverride(
  "components/dashboard/welcome",
  slug,
  () => import("@core/components/dashboard/welcome"),
);
```

Se `client/bar-mario/overrides/components/dashboard/welcome.tsx` esiste, viene usato;
altrimenti fallback a `core/components/dashboard/welcome.tsx`.

## Linee guida

- **Preferisci sempre DB-driven** rispetto al code override
- Mantieni il numero di override basso (idealmente <10 per cliente)
- Aggiorna periodicamente dal template upstream (`git pull origin main`)
- Override non versionati nel template: ogni cliente ha il suo branch/repo
