import { NextResponse } from "next/server";
import { runLowStockScan } from "@core/modules/low-stock-alerts/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await runLowStockScan();
  return NextResponse.json({ ok: true, summary });
}
