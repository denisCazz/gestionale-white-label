import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireSuperAdmin } from "@core/lib/guards";
import { prisma } from "@core/lib/prisma";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import { MODULES } from "@core/modules/registry";
import { ModuleToggle } from "./module-toggle";
import { ClientStatusToggle } from "./status-toggle";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      modules: true,
      _count: { select: { users: true, products: true } },
    },
  });
  if (!client) notFound();

  interface ClientModuleRow {
    clientId: string;
    moduleKey: string;
    enabled: boolean;
    expiresAt: Date | null;
    config: unknown;
    createdAt: Date;
    updatedAt: Date;
  }
  const moduleMap = new Map(
    (client.modules as ClientModuleRow[]).map((m) => [m.moduleKey, m] as const)
  );

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/admin/clients">
          <ArrowLeft className="h-4 w-4" /> Indietro
        </Link>
      </Button>
      <PageHeader
        title={client.ragioneSociale}
        subtitle={`/${client.slug} — ${client._count.users} utenti, ${client._count.products} prodotti`}
        actions={
          <>
            <Button asChild variant="outline">
              <a href={`/t/${client.slug}/dashboard`} target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4" /> Apri area cliente
              </a>
            </Button>
            <ClientStatusToggle id={client.id} active={client.active} />
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Moduli</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MODULES.map((m) => {
            const cm = moduleMap.get(m.key);
            return (
              <div key={m.key} className="flex items-start gap-4 p-3 rounded-md border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{m.name}</p>
                    {!m.isPaid ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <Badge variant="secondary">PRO €{m.priceMonthly}/m</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  {cm?.expiresAt && (
                    <p className="text-xs mt-1">
                      Scade: <span className="font-mono">{cm.expiresAt.toISOString().slice(0, 10)}</span>
                    </p>
                  )}
                </div>
                <ModuleToggle
                  clientId={client.id}
                  moduleKey={m.key}
                  enabled={cm?.enabled ?? !m.isPaid}
                  expiresAt={cm?.expiresAt?.toISOString().slice(0, 10) ?? null}
                  isPaid={m.isPaid}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
