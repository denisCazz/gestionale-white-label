import { getTranslations } from "next-intl/server";
import { requireTenant } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@core/components/ui/tabs";
import { Badge } from "@core/components/ui/badge";
import { CompanyForm } from "./company-form";
import { UsersTable } from "./users-table";
import { UserDialog } from "./user-dialog";
import { Button } from "@core/components/ui/button";
import { Plus } from "lucide-react";
import { MODULES } from "@core/modules/registry";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant, user, db } = await requireTenant(slug);
  const t = await getTranslations("settings");

  const fullClient = await prisma.client.findUnique({ where: { id: tenant.id } });
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader title={t("title")} />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{t("company")}</TabsTrigger>
          <TabsTrigger value="users">{t("users")}</TabsTrigger>
          <TabsTrigger value="modules">{t("modules")}</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("company")}</CardTitle>
            </CardHeader>
            <CardContent>
              {fullClient && (
                <CompanyForm
                  slug={slug}
                  initial={{
                    ragioneSociale: fullClient.ragioneSociale,
                    partitaIva: fullClient.partitaIva,
                    email: fullClient.email,
                    telefono: fullClient.telefono,
                    indirizzo: fullClient.indirizzo,
                    citta: fullClient.citta,
                    cap: fullClient.cap,
                    provincia: fullClient.provincia,
                    logoUrl: fullClient.logoUrl,
                    primaryColor: fullClient.primaryColor,
                    locale: fullClient.locale,
                    currency: fullClient.currency,
                  }}
                  canEdit={user.role === "ADMIN" || user.role === "SUPER_ADMIN"}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("users")}</CardTitle>
              <UserDialog
                slug={slug}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> {t("newUser")}
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <UsersTable
                slug={slug}
                users={users.map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  active: u.active,
                  lastLoginAt: u.lastLoginAt,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-4 space-y-3">
          {MODULES.map((m) => {
            const enabled = !m.isPaid || tenant.enabledModules.includes(m.key);
            return (
              <Card key={m.key}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{m.name}</p>
                      {!m.isPaid ? (
                        <Badge variant="success">Free</Badge>
                      ) : (
                        <Badge variant="secondary">PRO €{m.priceMonthly}/mese</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  </div>
                  {enabled ? (
                    <Badge variant="success">Attivo</Badge>
                  ) : (
                    <Badge variant="outline">Disattivato</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
