import { getTranslations } from "next-intl/server";
import { Plus, Thermometer, Calendar, FileDown } from "lucide-react";
import { addDays } from "date-fns";
import { requireModule } from "@core/lib/guards";
import { PageHeader } from "@core/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@core/components/ui/tabs";
import { Badge } from "@core/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import { LotDialog } from "./lot-dialog";
import { FridgeDialog } from "./fridge-dialog";
import { ReadingDialog } from "./reading-dialog";
import { formatDate, formatDateTime } from "@core/lib/utils";

export default async function HaccpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db } = await requireModule(slug, "haccp");
  const t = await getTranslations("haccp");

  const horizon = addDays(new Date(), 30);

  const [lots, fridges, readings, products] = await Promise.all([
    db.haccpLot.findMany({
      where: { consumed: false },
      orderBy: { expiresAt: "asc" },
      include: { product: { select: { name: true, sku: true, unit: true } } },
      take: 100,
    }),
    db.fridge.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.fridgeReading.findMany({
      orderBy: { recordedAt: "desc" },
      include: { fridge: { select: { name: true, minTemp: true, maxTemp: true } } },
      take: 50,
    }),
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={`/api/haccp/export?slug=${slug}`} target="_blank" rel="noopener">
                <FileDown className="h-4 w-4" /> Export
              </a>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="lots">
        <TabsList>
          <TabsTrigger value="lots">{t("lots")}</TabsTrigger>
          <TabsTrigger value="fridges">{t("fridges")}</TabsTrigger>
          <TabsTrigger value="readings">{t("readings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <LotDialog
              slug={slug}
              products={products}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> {t("newLot")}
                </Button>
              }
            />
          </div>
          <Card>
            <CardContent className="p-0">
              {lots.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">Nessun lotto</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("lotCode")}</TableHead>
                      <TableHead>Prodotto</TableHead>
                      <TableHead>Quantità</TableHead>
                      <TableHead>{t("expiresAt")}</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lots.map((l) => {
                      const exp = new Date(l.expiresAt);
                      const expiringSoon = exp <= horizon;
                      const expired = exp < new Date();
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono">{l.lotCode}</TableCell>
                          <TableCell>{l.product?.name ?? "?"}</TableCell>
                          <TableCell>
                            {Number(l.quantity)} {l.product?.unit}
                          </TableCell>
                          <TableCell>{formatDate(exp)}</TableCell>
                          <TableCell>
                            {expired ? (
                              <Badge variant="destructive">Scaduto</Badge>
                            ) : expiringSoon ? (
                              <Badge variant="warning">{t("expiringSoon")}</Badge>
                            ) : (
                              <Badge variant="success">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fridges" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <FridgeDialog
              slug={slug}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> {t("newFridge")}
                </Button>
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fridges.map((f) => (
              <Card key={f.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Thermometer className="h-4 w-4 text-primary" />
                    {f.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{f.location ?? "—"}</p>
                  <p className="text-sm">
                    Range: <span className="font-mono">{Number(f.minTemp)}°C</span> –{" "}
                    <span className="font-mono">{Number(f.maxTemp)}°C</span>
                  </p>
                  <ReadingDialog
                    slug={slug}
                    fridges={[{ id: f.id, name: f.name }]}
                    defaultFridgeId={f.id}
                    trigger={
                      <Button size="sm" variant="outline" className="mt-3 w-full">
                        <Plus className="h-4 w-4" /> {t("newReading")}
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ))}
            {fridges.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-12 text-center text-muted-foreground">
                  Nessun frigo configurato
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <ReadingDialog
              slug={slug}
              fridges={fridges.map((f) => ({ id: f.id, name: f.name }))}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> {t("newReading")}
                </Button>
              }
            />
          </div>
          <Card>
            <CardContent className="p-0">
              {readings.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">Nessuna rilevazione</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Frigo</TableHead>
                      <TableHead>{t("temperature")}</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readings.map((r) => {
                      const temp = Number(r.temperature);
                      const min = Number(r.fridge.minTemp);
                      const max = Number(r.fridge.maxTemp);
                      const out = temp < min || temp > max;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{formatDateTime(r.recordedAt)}</TableCell>
                          <TableCell>{r.fridge.name}</TableCell>
                          <TableCell className="font-mono">{temp}°C</TableCell>
                          <TableCell>
                            {out ? <Badge variant="destructive">Fuori range</Badge> : <Badge variant="success">OK</Badge>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.notes ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
