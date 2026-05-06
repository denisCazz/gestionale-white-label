import { NextResponse } from "next/server";
import { requireModule } from "@core/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  const { db } = await requireModule(slug, "haccp");

  const [readings, lots] = await Promise.all([
    db.fridgeReading.findMany({
      orderBy: { recordedAt: "desc" },
      include: { fridge: true },
      take: 1000,
    }),
    db.haccpLot.findMany({ include: { product: true }, take: 1000 }),
  ]);

  const lines: string[] = [];
  lines.push("=== REGISTRO TEMPERATURE ===");
  lines.push("Data,Frigo,Temperatura,MinRange,MaxRange,Note");
  for (const r of readings) {
    lines.push(
      [
        r.recordedAt.toISOString(),
        csv(r.fridge.name),
        Number(r.temperature),
        Number(r.fridge.minTemp),
        Number(r.fridge.maxTemp),
        csv(r.notes ?? ""),
      ].join(",")
    );
  }
  lines.push("");
  lines.push("=== LOTTI ===");
  lines.push("LotCode,Prodotto,Quantità,Scadenza,Note");
  for (const l of lots) {
    lines.push(
      [
        csv(l.lotCode),
        csv(l.product?.name ?? ""),
        Number(l.quantity),
        l.expiresAt.toISOString().slice(0, 10),
        csv(l.notes ?? ""),
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="haccp-${slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
