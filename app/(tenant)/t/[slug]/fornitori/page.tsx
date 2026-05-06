import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireTenant } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Button } from "@core/components/ui/button";
import { Card, CardContent } from "@core/components/ui/card";
import { SuppliersTable } from "./suppliers-table";
import { SupplierDialog } from "./supplier-dialog";

export default async function SuppliersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db } = await requireTenant(slug);
  const t = await getTranslations("suppliers");

  const suppliers = await db.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <SupplierDialog
            slug={slug}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {t("newSupplier")}
              </Button>
            }
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          <SuppliersTable
            slug={slug}
            suppliers={suppliers.map((s) => ({
              id: s.id,
              name: s.name,
              vatNumber: s.vatNumber,
              email: s.email,
              phone: s.phone,
              address: s.address,
              notes: s.notes,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
