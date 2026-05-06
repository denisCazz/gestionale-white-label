# Credenziali di accesso (dopo `pnpm db:seed`)

URL login: http://localhost:3000/login

## Super-admin

Lascia **vuoto** il campo “Codice azienda” (tenant).

| Campo | Valore |
|--------|--------|
| Email | `admin@gestionale.local` |
| Password | `admin123` |

Dopo il login: area super-admin (`/admin/clients`).

## Cliente demo (Bar Demo)

Tenant / codice azienda: **`demo`**

| Ruolo | Email | Password |
|--------|--------|----------|
| Admin | `admin@bardemo.it` | `demo1234` |
| Staff | `staff@bardemo.it` | `staff1234` |

Dopo il login: area cliente (`/t/demo/dashboard`).

---

**Nota:** queste password sono solo per sviluppo. In produzione genera segreti forti e non committare `.env`.
