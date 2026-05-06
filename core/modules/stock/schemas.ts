import { z } from "zod";
import { MovementType } from "@prisma/client";

export const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  barcode: z.string().max(64).optional().or(z.literal("")),
  unit: z.string().min(1).max(16).default("pz"),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  supplierId: z.string().optional().or(z.literal("")),
  costPrice: z.coerce.number().min(0).default(0),
  sellPrice: z.coerce.number().min(0).default(0),
  vatRate: z.coerce.number().min(0).max(100).default(22),
  minStock: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.nativeEnum(MovementType),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0).optional(),
  note: z.string().optional().or(z.literal("")),
});

export type MovementInput = z.infer<typeof movementSchema>;

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  vatNumber: z.string().max(32).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
