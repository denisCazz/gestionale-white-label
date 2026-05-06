import { NextResponse } from "next/server";
import { requireModule } from "@core/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  const { db } = await requireModule(slug, "reports");

  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
  });

  const rows = ["SKU,Nome,Categoria,Fornitore,Giacenza,UM,Costo,PrezzoVendita,IVA,ValoreCosto,ValoreVendita"];
  for (const p of products) {
    rows.push(
      [
        csv(p.sku),
        csv(p.name),
        csv(p.category?.name ?? ""),
        csv(p.supplier?.name ?? ""),
        Number(p.currentStock),
        p.unit,
        Number(p.costPrice),
        Number(p.sellPrice),
        Number(p.vatRate),
        (Number(p.currentStock) * Number(p.costPrice)).toFixed(2),
        (Number(p.currentStock) * Number(p.sellPrice)).toFixed(2),
      ].join(",")
    );
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
