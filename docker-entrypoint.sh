#!/bin/sh
set -e

# ─────────────────────────────────────────────────────────────
# Assembla DATABASE_URL dai singoli campi del .env
# ─────────────────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Imposta DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD nel file .env"
    exit 1
  fi
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo "📦 DATABASE_URL assemblata"

# ─────────────────────────────────────────────────────────────
# Esegui le migration (crea tabelle se non esistono)
# ─────────────────────────────────────────────────────────────
echo "🔄 Esecuzione migrazioni..."
pnpm prisma migrate deploy

# ─────────────────────────────────────────────────────────────
# Esegui il seed (moduli + super-admin da ADMIN_EMAIL/ADMIN_PASSWORD)
# ─────────────────────────────────────────────────────────────
echo "🌱 Seed database..."
pnpm db:seed

# ─────────────────────────────────────────────────────────────
# Avvia l'applicazione
# ─────────────────────────────────────────────────────────────
echo "🚀 Avvio gestionale..."
exec pnpm start
