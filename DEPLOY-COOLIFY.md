# Deploy su VPS con Coolify

Non serve accedere dal repo al server: configuri tutto dalla UI Coolify e variabili ambiente.

Il DB che userai è **PostgreSQL** raggiungibile da questa app così:

```
Host:    212.227.193.249
Porta:   60001
```

(Sostituisci con i valori che Coolify mostra nella scheda del database, se diversi.)

---

## 1. Database nuovo “da zero” in Coolify

### Opzione A – Servizio PostgreSQL gestito da Coolify

1. In Coolify: **+ New Resource** → **Database** → **PostgreSQL**.
2. Deploya l’istanza (scegli server/VPS, volume, ecc.).
3. Nella scheda del database trovi **Connection string**, **User**, **Password**, **Database name**, **Port**.  
   Coolify crea già utente + database: non devi creare nulla a mano.
4. Annota:
   - nome database (es. `postgres` o quello generato)
   - utente / password
   - host interno o pubblico (talvolta è un hostname tipo `postgres-xxx...`, non sempre l’IP)
5. Metti nell’app `DATABASE_URL` (vedi sotto §3).

### Opzione B – PostgreSQL esterno sulla VPS (solo porta 60001)

Se Postgres è già installato/hostato e hai accesso da superuser:

```sql
CREATE USER gestionale WITH PASSWORD 'SCEGLI_PASSWORD_SICURA';
CREATE DATABASE gestionale OWNER gestionale;
GRANT ALL PRIVILEGES ON DATABASE gestionale TO gestionale;
\c gestionale
GRANT ALL ON SCHEMA public TO gestionale;
```

Collegati con `psql` (dal server o dopo aver aperto il firewall sulla 60001):

```bash
psql "postgresql://postgres:PASSWORD_SUPERUSER@212.227.193.249:60001/postgres"
```

Poi incolla gli `CREATE` sopra.

**Sicurezza:** apri la 60001 solo verso il server dove gira l’app Coolify (IP del worker), non verso tutto internet.

---

## 2. Variabili ambiente nell’app (Coolify → Application → Environment Variables)

Minimo indispensabile:

| Chiave | Esempio | Note |
|--------|---------|------|
| `DATABASE_URL` | `postgresql://gestionale:PASSWORD@212.227.193.249:60001/gestionale?schema=public` | No spazi negli URI; password URL-encoded se ha caratteri speciali (`@` → `%40`, ecc.). |
| `AUTH_SECRET` | output di `openssl rand -base64 32` | Obbligatorio in prod. |
| `AUTH_TRUST_HOST` | `true` | Dietro reverse proxy di Coolify. |
| `NEXTAUTH_URL` | `https://tuo-dominio.it` | **URL pubblico** esatto dove risponde l’app (no slash finale problematico). |
| `NEXT_PUBLIC_APP_URL` | opzionale, stesso dell’API se usi link assoluti | |

Opzionali:

| Chiave | Note |
|--------|------|
| `RESEND_API_KEY` / `EMAIL_FROM` | Email (avvisi, ordini). |
| `CRON_SECRET` | Per chiamare `/api/cron/low-stock` da scheduler esterno. |
| `APP_NAME` | Nome in metadata. |

**Esempio `DATABASE_URL`:**

```env
DATABASE_URL="postgresql://gestionale:LA_TUA_PASSWORD@212.227.193.249:60001/gestionale?schema=public"
```

Se Coolify espone Postgres solo sulla **rete Docker** interna, usa l’hostname che ti dà Coolify (non l’IP pubblico) nella stringa.

---

## 3. Applicazione Next.js in Coolify

1. **New Resource** → **Application** → collega il repo Git.
2. **Build pack**: Nixpacks o Dockerfile (se non hai Dockerfile, Nixpacks va bene per Node).
3. **Build command** (se non auto-detect):

   ```bash
   pnpm install --frozen-lockfile && pnpm db:generate && pnpm build
   ```

4. **Start command:**

   ```bash
   pnpm start
   ```

5. **Release / deploy hook** (dopo build, **prima** di mettere in produzione): esegui le migrazioni sul DB remoto:

   ```bash
   pnpm db:migrate:deploy
   ```

   In Coolify spesso c’è un campo **“Execute Command on startup”** separato: meglio usare **Release Command** se disponibile, così le migrazioni girano una volta per deploy e non ad ogni avvio del container.

6. **Seed** (solo prima volta o demo): da container one-off o deploy temporaneo:

   ```bash
   pnpm db:seed
   ```

   In produzione reale spesso **non** esegui il seed aut automatico; crei clienti dal super-admin.

---

## 4. Checklist post-deploy

- [ ] `DATABASE_URL` punta al DB giusto e la rete allow-list è OK.
- [ ] `prisma migrate deploy` completato senza errori.
- [ ] `NEXTAUTH_URL` = URL reale dell’app (HTTPS).
- [ ] `AUTH_SECRET` impostato.
- [ ] Login super-admin (vedi `LOGIN.md`) dopo eventuale seed.

---

## 5. Cron low-stock (opzionale)

Scheduler esterno (Coolify scheduled job, o altro) che chiama:

```http
GET https://tuo-dominio.it/api/cron/low-stock
Authorization: Bearer IL_TUO_CRON_SECRET
```

---

## Riferimenti comandi locali (verso DB remoto)

Con `DATABASE_URL` nel `.env` locale puntato al server:

```bash
pnpm db:migrate:deploy   # applica migrazioni in prod
pnpm db:seed             # dati demo (opzionale)
```

Per problemi SSL con Postgres hosted: alcuni provider richiedono `?sslmode=require` in coda alla `DATABASE_URL`.
