import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Tenant-scoped Prisma extension. Auto-injects clientId into where clauses
 * and create data for tenant-scoped models, preventing cross-tenant leaks.
 *
 * Usage: const db = tenantPrisma(clientId); await db.product.findMany();
 */
const TENANT_MODELS = new Set([
  "User",
  "ClientModule",
  "ProductCategory",
  "Product",
  "StockMovement",
  "Supplier",
  "SupplierOrder",
  "HaccpLot",
  "Fridge",
  "FridgeReading",
  "Alert",
  "Notification",
  "AuditLog",
]);

export function tenantPrisma(clientId: string) {
  return prisma.$extends({
    name: "tenantScope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args);

          const a = args as Record<string, unknown>;

          if (
            operation === "findFirst" ||
            operation === "findFirstOrThrow" ||
            operation === "findMany" ||
            operation === "findUnique" ||
            operation === "findUniqueOrThrow" ||
            operation === "count" ||
            operation === "aggregate" ||
            operation === "groupBy"
          ) {
            a.where = { ...((a.where as object) ?? {}), clientId };
          } else if (operation === "create") {
            a.data = { ...((a.data as object) ?? {}), clientId };
          } else if (operation === "createMany") {
            const data = a.data as Array<Record<string, unknown>> | Record<string, unknown>;
            if (Array.isArray(data)) {
              a.data = data.map((d) => ({ ...d, clientId }));
            } else if (data) {
              a.data = { ...data, clientId };
            }
          } else if (operation === "update" || operation === "updateMany") {
            a.where = { ...((a.where as object) ?? {}), clientId };
          } else if (operation === "delete" || operation === "deleteMany") {
            a.where = { ...((a.where as object) ?? {}), clientId };
          } else if (operation === "upsert") {
            a.where = { ...((a.where as object) ?? {}), clientId };
            a.create = { ...((a.create as object) ?? {}), clientId };
          }

          return query(a as Prisma.Args<typeof query, typeof operation>);
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof tenantPrisma>;
