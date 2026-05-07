-- =============================================================
-- GESTIONALE WHITE LABEL — Setup completo database
-- Eseguire su PostgreSQL come superuser o owner del database
-- Esempio: psql -h 212.227.193.249 -p 60001 -U <user> -d gestionale -f setup.sql
-- =============================================================

-- Tabella di tracking migrazioni Prisma (necessaria per prisma migrate deploy)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36)  PRIMARY KEY,
    "checksum"              VARCHAR(64)  NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER      NOT NULL DEFAULT 0
);

-- =============================================================
-- ENUM
-- =============================================================

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MovementType" AS ENUM ('LOAD', 'UNLOAD', 'ADJUST', 'WASTE', 'TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupplierOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'EXPIRING_LOT', 'FRIDGE_OUT_OF_RANGE', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- TABELLE
-- =============================================================

CREATE TABLE IF NOT EXISTS "Client" (
    "id"             TEXT        NOT NULL,
    "slug"           TEXT        NOT NULL,
    "ragioneSociale" TEXT        NOT NULL,
    "partitaIva"     TEXT,
    "codiceFiscale"  TEXT,
    "indirizzo"      TEXT,
    "citta"          TEXT,
    "cap"            TEXT,
    "provincia"      TEXT,
    "email"          TEXT,
    "telefono"       TEXT,
    "logoUrl"        TEXT,
    "primaryColor"   TEXT        NOT NULL DEFAULT '#0ea5e9',
    "secondaryColor" TEXT        NOT NULL DEFAULT '#64748b',
    "locale"         TEXT        NOT NULL DEFAULT 'it',
    "currency"       TEXT        NOT NULL DEFAULT 'EUR',
    "active"         BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Client_slug_key" ON "Client"("slug");

CREATE TABLE IF NOT EXISTS "User" (
    "id"           TEXT        NOT NULL,
    "clientId"     TEXT,
    "email"        TEXT        NOT NULL,
    "passwordHash" TEXT        NOT NULL,
    "name"         TEXT        NOT NULL,
    "role"         "Role"      NOT NULL DEFAULT 'STAFF',
    "active"       BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt"  TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "User_clientId_idx" ON "User"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_clientId_email_key" ON "User"("clientId", "email");

CREATE TABLE IF NOT EXISTS "Module" (
    "key"          TEXT        NOT NULL,
    "name"         TEXT        NOT NULL,
    "description"  TEXT        NOT NULL,
    "category"     TEXT        NOT NULL DEFAULT 'extra',
    "isPaid"       BOOLEAN     NOT NULL DEFAULT true,
    "priceMonthly" DECIMAL(10,2),
    "icon"         TEXT,
    "sortOrder"    INTEGER     NOT NULL DEFAULT 0,
    "active"       BOOLEAN     NOT NULL DEFAULT true,
    CONSTRAINT "Module_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "ClientModule" (
    "clientId"  TEXT        NOT NULL,
    "moduleKey" TEXT        NOT NULL,
    "enabled"   BOOLEAN     NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "config"    JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientModule_pkey" PRIMARY KEY ("clientId","moduleKey")
);

CREATE INDEX IF NOT EXISTS "ClientModule_clientId_idx" ON "ClientModule"("clientId");

CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "id"       TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "color"    TEXT,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductCategory_clientId_idx" ON "ProductCategory"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_clientId_name_key" ON "ProductCategory"("clientId", "name");

CREATE TABLE IF NOT EXISTS "Product" (
    "id"           TEXT          NOT NULL,
    "clientId"     TEXT          NOT NULL,
    "sku"          TEXT          NOT NULL,
    "barcode"      TEXT,
    "name"         TEXT          NOT NULL,
    "description"  TEXT,
    "unit"         TEXT          NOT NULL DEFAULT 'pz',
    "categoryId"   TEXT,
    "supplierId"   TEXT,
    "costPrice"    DECIMAL(12,4) NOT NULL DEFAULT 0,
    "sellPrice"    DECIMAL(12,4) NOT NULL DEFAULT 0,
    "vatRate"      DECIMAL(5,2)  NOT NULL DEFAULT 22,
    "minStock"     DECIMAL(14,4) NOT NULL DEFAULT 0,
    "currentStock" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "active"       BOOLEAN       NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Product_clientId_idx" ON "Product"("clientId");
CREATE INDEX IF NOT EXISTS "Product_clientId_categoryId_idx" ON "Product"("clientId", "categoryId");
CREATE INDEX IF NOT EXISTS "Product_clientId_supplierId_idx" ON "Product"("clientId", "supplierId");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_clientId_sku_key" ON "Product"("clientId", "sku");

CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id"        TEXT          NOT NULL,
    "clientId"  TEXT          NOT NULL,
    "productId" TEXT          NOT NULL,
    "type"      "MovementType" NOT NULL,
    "quantity"  DECIMAL(14,4) NOT NULL,
    "unitCost"  DECIMAL(12,4),
    "note"      TEXT,
    "userId"    TEXT,
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockMovement_clientId_productId_idx" ON "StockMovement"("clientId", "productId");
CREATE INDEX IF NOT EXISTS "StockMovement_clientId_createdAt_idx" ON "StockMovement"("clientId", "createdAt");

CREATE TABLE IF NOT EXISTS "Supplier" (
    "id"        TEXT        NOT NULL,
    "clientId"  TEXT        NOT NULL,
    "name"      TEXT        NOT NULL,
    "vatNumber" TEXT,
    "email"     TEXT,
    "phone"     TEXT,
    "address"   TEXT,
    "notes"     TEXT,
    "active"    BOOLEAN     NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Supplier_clientId_idx" ON "Supplier"("clientId");

CREATE TABLE IF NOT EXISTS "SupplierOrder" (
    "id"         TEXT                 NOT NULL,
    "clientId"   TEXT                 NOT NULL,
    "supplierId" TEXT                 NOT NULL,
    "number"     TEXT                 NOT NULL,
    "status"     "SupplierOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes"      TEXT,
    "total"      DECIMAL(12,2)        NOT NULL DEFAULT 0,
    "sentAt"     TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupplierOrder_clientId_supplierId_idx" ON "SupplierOrder"("clientId", "supplierId");
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierOrder_clientId_number_key" ON "SupplierOrder"("clientId", "number");

CREATE TABLE IF NOT EXISTS "SupplierOrderItem" (
    "id"        TEXT          NOT NULL,
    "orderId"   TEXT          NOT NULL,
    "productId" TEXT          NOT NULL,
    "quantity"  DECIMAL(14,4) NOT NULL,
    "unitCost"  DECIMAL(12,4) NOT NULL,
    CONSTRAINT "SupplierOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HaccpLot" (
    "id"         TEXT          NOT NULL,
    "clientId"   TEXT          NOT NULL,
    "productId"  TEXT          NOT NULL,
    "lotCode"    TEXT          NOT NULL,
    "quantity"   DECIMAL(14,4) NOT NULL,
    "receivedAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMP(3)  NOT NULL,
    "notes"      TEXT,
    "consumed"   BOOLEAN       NOT NULL DEFAULT false,
    CONSTRAINT "HaccpLot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HaccpLot_clientId_productId_idx" ON "HaccpLot"("clientId", "productId");
CREATE INDEX IF NOT EXISTS "HaccpLot_clientId_expiresAt_idx" ON "HaccpLot"("clientId", "expiresAt");

CREATE TABLE IF NOT EXISTS "Fridge" (
    "id"       TEXT         NOT NULL,
    "clientId" TEXT         NOT NULL,
    "name"     TEXT         NOT NULL,
    "location" TEXT,
    "minTemp"  DECIMAL(5,2) NOT NULL DEFAULT 0,
    "maxTemp"  DECIMAL(5,2) NOT NULL DEFAULT 8,
    "active"   BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT "Fridge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Fridge_clientId_idx" ON "Fridge"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "Fridge_clientId_name_key" ON "Fridge"("clientId", "name");

CREATE TABLE IF NOT EXISTS "FridgeReading" (
    "id"          TEXT         NOT NULL,
    "clientId"    TEXT         NOT NULL,
    "fridgeId"    TEXT         NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "notes"       TEXT,
    "userId"      TEXT,
    "recordedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FridgeReading_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FridgeReading_clientId_fridgeId_recordedAt_idx" ON "FridgeReading"("clientId", "fridgeId", "recordedAt");

CREATE TABLE IF NOT EXISTS "Alert" (
    "id"         TEXT            NOT NULL,
    "clientId"   TEXT            NOT NULL,
    "type"       "AlertType"     NOT NULL,
    "severity"   "AlertSeverity" NOT NULL DEFAULT 'WARNING',
    "title"      TEXT            NOT NULL,
    "message"    TEXT            NOT NULL,
    "productId"  TEXT,
    "meta"       JSONB,
    "resolved"   BOOLEAN         NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Alert_clientId_resolved_createdAt_idx" ON "Alert"("clientId", "resolved", "createdAt");

CREATE TABLE IF NOT EXISTS "Notification" (
    "id"        TEXT        NOT NULL,
    "clientId"  TEXT        NOT NULL,
    "userId"    TEXT,
    "title"     TEXT        NOT NULL,
    "body"      TEXT        NOT NULL,
    "link"      TEXT,
    "read"      BOOLEAN     NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_clientId_userId_read_idx" ON "Notification"("clientId", "userId", "read");

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"        TEXT        NOT NULL,
    "clientId"  TEXT,
    "userId"    TEXT,
    "action"    TEXT        NOT NULL,
    "entity"    TEXT        NOT NULL,
    "entityId"  TEXT,
    "meta"      JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_clientId_createdAt_idx" ON "AuditLog"("clientId", "createdAt");

-- =============================================================
-- FOREIGN KEYS
-- =============================================================

ALTER TABLE "User"
    ADD CONSTRAINT IF NOT EXISTS "User_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientModule"
    ADD CONSTRAINT IF NOT EXISTS "ClientModule_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientModule"
    ADD CONSTRAINT IF NOT EXISTS "ClientModule_moduleKey_fkey"
    FOREIGN KEY ("moduleKey") REFERENCES "Module"("key") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product"
    ADD CONSTRAINT IF NOT EXISTS "Product_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product"
    ADD CONSTRAINT IF NOT EXISTS "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product"
    ADD CONSTRAINT IF NOT EXISTS "Product_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
    ADD CONSTRAINT IF NOT EXISTS "StockMovement_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
    ADD CONSTRAINT IF NOT EXISTS "StockMovement_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
    ADD CONSTRAINT IF NOT EXISTS "StockMovement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Supplier"
    ADD CONSTRAINT IF NOT EXISTS "Supplier_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierOrder"
    ADD CONSTRAINT IF NOT EXISTS "SupplierOrder_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierOrder"
    ADD CONSTRAINT IF NOT EXISTS "SupplierOrder_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierOrderItem"
    ADD CONSTRAINT IF NOT EXISTS "SupplierOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "SupplierOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierOrderItem"
    ADD CONSTRAINT IF NOT EXISTS "SupplierOrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HaccpLot"
    ADD CONSTRAINT IF NOT EXISTS "HaccpLot_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HaccpLot"
    ADD CONSTRAINT IF NOT EXISTS "HaccpLot_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Fridge"
    ADD CONSTRAINT IF NOT EXISTS "Fridge_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FridgeReading"
    ADD CONSTRAINT IF NOT EXISTS "FridgeReading_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FridgeReading"
    ADD CONSTRAINT IF NOT EXISTS "FridgeReading_fridgeId_fkey"
    FOREIGN KEY ("fridgeId") REFERENCES "Fridge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FridgeReading"
    ADD CONSTRAINT IF NOT EXISTS "FridgeReading_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Alert"
    ADD CONSTRAINT IF NOT EXISTS "Alert_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Alert"
    ADD CONSTRAINT IF NOT EXISTS "Alert_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification"
    ADD CONSTRAINT IF NOT EXISTS "Notification_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT IF NOT EXISTS "AuditLog_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT IF NOT EXISTS "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductCategory"
    ADD CONSTRAINT IF NOT EXISTS "ProductCategory_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================
-- DATI INIZIALI — Catalogo moduli
-- =============================================================

INSERT INTO "Module" ("key", "name", "description", "category", "isPaid", "priceMonthly", "icon", "sortOrder", "active")
VALUES
  ('stock',            'Magazzino',           'Gestione prodotti, fornitori, carico/scarico, inventario',                          'core',  false, NULL,  'Package',    10, true),
  ('low-stock-alerts', 'Avvisi sottoscorta',  'Notifiche automatiche quando i prodotti scendono sotto la soglia minima',           'extra', true,  9.90,  'BellRing',   20, true),
  ('ai-forecast',      'Previsione AI',       'Previsione consumi e suggerimenti di riordino basati sullo storico',                'extra', true,  19.90, 'Sparkles',   30, true),
  ('supplier-orders',  'Ordini fornitori',    'Bozze d''ordine automatiche e invio email al fornitore',                           'extra', true,  14.90, 'Truck',      40, true),
  ('haccp',            'HACCP',               'Lotti, scadenze, registro temperature, export PDF/CSV',                            'extra', true,  24.90, 'ShieldCheck',50, true),
  ('reports',          'Report avanzati',     'Dashboard analytics, top prodotti, margini, export CSV',                           'extra', true,  12.90, 'BarChart3',  60, true)
ON CONFLICT ("key") DO NOTHING;

-- =============================================================
-- DATI INIZIALI — Super Admin
-- Password: admin123  (bcrypt hash, rounds=12)
-- CAMBIARE SUBITO in produzione!
-- =============================================================

INSERT INTO "User" ("id", "clientId", "email", "passwordHash", "name", "role", "active", "createdAt", "updatedAt")
VALUES (
  'superadmin-0001',
  NULL,
  'admin@gestionale.local',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlUqmzT7XyRNOq3l8sDkqhZCq',
  'Super Admin',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
