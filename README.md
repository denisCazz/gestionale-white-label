# Gestionale White-Label per Bar/Ristoranti

Template multi-tenant in **Next.js** + **Prisma** + **PostgreSQL** per costruire gestionali per bar e ristoranti, con sistema di moduli a pagamento e personalizzazione white-label.

## Caratteristiche

- **Multi-tenant single-DB**: una sola istanza serve N clienti, ognuno isolato tramite `clientId` su tutte le tabelle business
- **Branding da DB**: logo, colori, ragione sociale, lingua, valuta — tutto configurabile dal pannello super-admin senza redeploy
- **Sistema moduli pluggable**: free + a pagamento, attivabili per cliente con scadenza opzionale
- **Override per cliente**: cartella `client/<slug>/` per personalizzazioni di codice (vedi [client/README.md](client/README.md))
- **Auth.js v5** con credentials + bcrypt, session JWT con `clientId`/`role`/`enabledModules`
- **i18n**: italiano (default) + inglese, predisposto per nuove lingue
- **Pannello super-admin** separato per gestire clienti, moduli, utenti

## Moduli

| Modulo | Tipo | Descrizione |
|---|---|---|
| **Magazzino** | Free | CRUD prodotti, fornitori, categorie, movimenti carico/scarico/inventario |
| **Avvisi sottoscorta** | Pro €9.90/m | Notifiche automatiche soglia minima + email digest + cron daily |
| **Previsione AI** | Pro €19.90/m | Forecast consumi (regressione lineare) + suggerimenti riordino |
| **Ordini fornitori** | Pro €14.90/m | Bozze d'ordine auto da prodotti sottoscorta + invio email |
| **HACCP** | Pro €24.90/m | Lotti, scadenze, registro temperature frigo, export CSV |
| **Report** | Pro €12.90/m | Dashboard analytics, top prodotti, margini, export CSV |

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **PostgreSQL 16** + **Prisma 6**
- **Auth.js v5** (credentials + bcrypt)
- **Tailwind CSS 4** + **shadcn/ui** + **Recharts**
- **next-intl** (i18n)
- **Resend** (email, opzionale)
- **pnpm** + **Docker Compose**

## Setup rapido

```bash
# 1. Clone + install
git clone <questo-repo> mio-gestionale
cd mio-gestionale
pnpm install

# 2. Setup env
cp .env.example .env
# (opzionale) genera AUTH_SECRET: openssl rand -base64 32

# 3. Avvia Postgres
pnpm docker:up

# 4. Migrazione + seed
pnpm db:migrate
pnpm db:seed

# 5. Avvia dev
pnpm dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Credenziali demo (post-seed)

**Super-admin** (lascia campo "Codice azienda" vuoto):
- `admin@gestionale.local` / `admin123`

**Cliente demo "Bar Demo"** (tenant slug: `demo`):
- `admin@bardemo.it` / `demo1234` (Admin)
- `staff@bardemo.it` / `staff1234` (Staff)

## Struttura

```
.
├── app/
│   ├── (auth)/login/             # pagina login
│   ├── (tenant)/t/[slug]/        # area cliente (uno spazio per tenant)
│   │   ├── dashboard
│   │   ├── magazzino
│   │   ├── fornitori
│   │   ├── avvisi          (modulo low-stock-alerts)
│   │   ├── forecast        (modulo ai-forecast)
│   │   ├── ordini          (modulo supplier-orders)
│   │   ├── haccp           (modulo haccp)
│   │   ├── report          (modulo reports)
│   │   ├── settings
│   │   └── upgrade
│   ├── (admin)/admin/             # super-admin
│   │   ├── clients
│   │   ├── modules
│   │   └── users
│   └── api/
│       ├── auth/[...nextauth]
│       ├── cron/low-stock         # GET con Bearer CRON_SECRET
│       └── reports|haccp/export   # CSV
├── core/
│   ├── components/                # UI riusabile (sidebar, topbar, shadcn)
│   ├── lib/                       # auth, prisma, tenant, guards, override
│   ├── modules/                   # moduli (registry, services, schemas, actions)
│   └── i18n/
├── client/                        # override per cliente (vuoto nel template)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── messages/                      # next-intl
├── middleware.ts
└── docker-compose.yml
```

## Multi-tenant

Tutte le tabelle business hanno FK `clientId` verso `Client`. Il client Prisma è wrappato da `tenantPrisma(clientId)` che auto-inietta `clientId` su ogni `where`/`create`/`update`, evitando leak cross-tenant. Vedi [core/lib/tenant-prisma.ts](core/lib/tenant-prisma.ts).

URL pattern: `/t/<slug>/*` per tenant, `/admin/*` per super-admin.

## Comandi

```bash
pnpm dev               # dev server con Turbopack
pnpm build             # build prod
pnpm start             # start prod
pnpm lint              # eslint

pnpm docker:up         # avvia Postgres
pnpm docker:down       # ferma Postgres

pnpm db:generate       # rigenera Prisma client
pnpm db:migrate        # nuova migrazione
pnpm db:push           # sync schema senza migrazione
pnpm db:reset          # reset DB (distruttivo)
pnpm db:studio         # apre Prisma Studio
pnpm db:seed           # seed demo
```

## Cron jobs

L'endpoint `/api/cron/low-stock` esegue lo scan giornaliero dei sottoscorta. Configura un cron esterno (Vercel Cron, GitHub Actions, system cron) che chiami:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/low-stock
```

Esempio `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/low-stock", "schedule": "0 8 * * *" }
  ]
}
```

## Email (opzionale)

Imposta `RESEND_API_KEY` per inviare email reali (avvisi sottoscorta digest, ordini fornitore). Senza chiave, le email vengono loggate in console come no-op (utile in dev).

## White-label per nuovo cliente

Per la maggior parte dei casi basta:

1. Super-admin → Nuovo cliente (slug, ragione sociale, branding)
2. Super-admin → Attiva moduli paid desiderati
3. Cliente accede con il suo slug

**Per personalizzazioni di codice** (raro): vedi [client/README.md](client/README.md).

## Sicurezza

- Password con bcrypt 12 rounds
- Session JWT 12h
- Tutte le query tenant-scoped via `tenantPrisma()` + `requireTenant()`/`requireModule()` guards
- Cron protetto da `CRON_SECRET`
- CSRF mitigato da server actions Next.js

## Roadmap (out-of-scope template iniziale)

- Stripe Subscriptions per attivazione moduli (ora flag-only)
- POS/Cassa
- Ricette/distinta base con scarico automatico
- Mobile app

## Licenza

Proprietary.
