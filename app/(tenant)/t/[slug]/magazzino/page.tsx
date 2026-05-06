import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireTenant } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Button } from "@core/components/ui/button";
import { Card, CardContent } from "@core/components/ui/card";
import { Input } from "@core/components/ui/input";
import { ProductsTable } from "./products-table";
import { ProductDialog } from "./product-dialog";
import { MovementDialog } from "./movement-dialog";

export default async function StockPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const { db } = await requireTenant(slug);
  const t = await getTranslations("stock");
  const tc = await getTranslations("common");

  const where = {
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { barcode: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, categories, suppliers] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ name: "asc" }],
      include: { category: true, supplier: true },
      take: 200,
    }),
    db.productCategory.findMany({ orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <MovementDialog
              slug={slug}
              products={products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, unit: p.unit }))}
            />
            <ProductDialog
              slug={slug}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  {t("newProduct")}
                </Button>
              }
            />
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-3">
          <form className="flex gap-2">
            <Input name="q" defaultValue={q} placeholder={tc("search") + "..."} className="max-w-md" />
            <Button type="submit" variant="secondary">
              {tc("search")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ProductsTable
            slug={slug}
            products={products.map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              unit: p.unit,
              category: p.category?.name ?? null,
              supplier: p.supplier?.name ?? null,
              currentStock: Number(p.currentStock),
              minStock: Number(p.minStock),
              costPrice: Number(p.costPrice),
              sellPrice: Number(p.sellPrice),
              vatRate: Number(p.vatRate),
              barcode: p.barcode,
              description: p.description,
              categoryId: p.categoryId,
              supplierId: p.supplierId,
            }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
