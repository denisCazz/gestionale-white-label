import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MODULES = [
  {
    key: "stock",
    name: "Magazzino",
    description: "Gestione prodotti, fornitori, carico/scarico, inventario",
    isPaid: false,
    priceMonthly: null,
    icon: "Package",
    sortOrder: 10,
  },
  {
    key: "low-stock-alerts",
    name: "Avvisi sottoscorta",
    description: "Notifiche automatiche quando i prodotti scendono sotto la soglia minima",
    isPaid: true,
    priceMonthly: new Prisma.Decimal(9.9),
    icon: "BellRing",
    sortOrder: 20,
  },
  {
    key: "ai-forecast",
    name: "Previsione AI",
    description: "Previsione consumi e suggerimenti di riordino basati sullo storico",
    isPaid: true,
    priceMonthly: new Prisma.Decimal(19.9),
    icon: "Sparkles",
    sortOrder: 30,
  },
  {
    key: "supplier-orders",
    name: "Ordini fornitori",
    description: "Bozze d'ordine automatiche e invio email al fornitore",
    isPaid: true,
    priceMonthly: new Prisma.Decimal(14.9),
    icon: "Truck",
    sortOrder: 40,
  },
  {
    key: "haccp",
    name: "HACCP",
    description: "Lotti, scadenze, registro temperature, export PDF/CSV",
    isPaid: true,
    priceMonthly: new Prisma.Decimal(24.9),
    icon: "ShieldCheck",
    sortOrder: 50,
  },
  {
    key: "reports",
    name: "Report avanzati",
    description: "Dashboard analytics, top prodotti, margini, export CSV",
    isPaid: true,
    priceMonthly: new Prisma.Decimal(12.9),
    icon: "BarChart3",
    sortOrder: 60,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Modules catalog
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { key: m.key },
      create: m,
      update: m,
    });
  }
  console.log(`✅ ${MODULES.length} moduli caricati`);

  // 2. Super-admin globale — usa le env var ADMIN_EMAIL e ADMIN_PASSWORD
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️  ADMIN_EMAIL o ADMIN_PASSWORD non impostati — super-admin non creato");
  } else {
    const superAdminPwd = await bcrypt.hash(adminPassword, 12);
    const existingSuper = await prisma.user.findFirst({
      where: { clientId: null, email: adminEmail },
    });
    if (!existingSuper) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Super Admin",
          passwordHash: superAdminPwd,
          role: "SUPER_ADMIN",
        },
      });
      console.log(`✅ Super-admin creato: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Super-admin già esistente: ${adminEmail}`);
    }
  }

  // 3. Demo client "Bar Demo"
  const demo = await prisma.client.upsert({
    where: { slug: "demo" },
    create: {
      slug: "demo",
      ragioneSociale: "Bar Demo SRL",
      partitaIva: "01234567890",
      email: "info@bardemo.it",
      indirizzo: "Via Roma 1",
      citta: "Milano",
      cap: "20100",
      provincia: "MI",
      logoUrl: null,
      primaryColor: "#0ea5e9",
      locale: "it",
      currency: "EUR",
    },
    update: {},
  });
  console.log(`✅ Cliente demo: ${demo.ragioneSociale} (slug: ${demo.slug})`);

  // 4. Attiva tutti i moduli per la demo
  for (const m of MODULES) {
    await prisma.clientModule.upsert({
      where: { clientId_moduleKey: { clientId: demo.id, moduleKey: m.key } },
      create: { clientId: demo.id, moduleKey: m.key, enabled: true },
      update: { enabled: true },
    });
  }
  console.log(`✅ Moduli attivati per demo`);

  // 5. Utenti del cliente demo
  const adminPwd = await bcrypt.hash("demo1234", 12);
  const staffPwd = await bcrypt.hash("staff1234", 12);
  const adminUser = await prisma.user.upsert({
    where: { clientId_email: { clientId: demo.id, email: "admin@bardemo.it" } },
    create: {
      clientId: demo.id,
      email: "admin@bardemo.it",
      name: "Mario Rossi",
      role: "ADMIN",
      passwordHash: adminPwd,
    },
    update: {},
  });
  await prisma.user.upsert({
    where: { clientId_email: { clientId: demo.id, email: "staff@bardemo.it" } },
    create: {
      clientId: demo.id,
      email: "staff@bardemo.it",
      name: "Luigi Bianchi",
      role: "STAFF",
      passwordHash: staffPwd,
    },
    update: {},
  });
  console.log(`✅ Utenti demo: admin@bardemo.it / demo1234, staff@bardemo.it / staff1234`);

  // 6. Categorie
  const catBevande = await prisma.productCategory.upsert({
    where: { clientId_name: { clientId: demo.id, name: "Bevande" } },
    create: { clientId: demo.id, name: "Bevande", color: "#3b82f6" },
    update: {},
  });
  const catCaffe = await prisma.productCategory.upsert({
    where: { clientId_name: { clientId: demo.id, name: "Caffè & Tè" } },
    create: { clientId: demo.id, name: "Caffè & Tè", color: "#a16207" },
    update: {},
  });
  const catFood = await prisma.productCategory.upsert({
    where: { clientId_name: { clientId: demo.id, name: "Food" } },
    create: { clientId: demo.id, name: "Food", color: "#16a34a" },
    update: {},
  });

  // 7. Fornitori (idempotente)
  const fornitoreA =
    (await prisma.supplier.findFirst({
      where: { clientId: demo.id, name: "Distributore Lombardo SRL" },
    })) ??
    (await prisma.supplier.create({
      data: {
        clientId: demo.id,
        name: "Distributore Lombardo SRL",
        vatNumber: "00112233445",
        email: "ordini@distrlombardo.it",
        phone: "+39 02 12345",
        address: "Via Garibaldi 10, Milano",
      },
    }));

  const fornitoreB =
    (await prisma.supplier.findFirst({
      where: { clientId: demo.id, name: "Caffè Italia SPA" },
    })) ??
    (await prisma.supplier.create({
      data: {
        clientId: demo.id,
        name: "Caffè Italia SPA",
        vatNumber: "00998877665",
        email: "vendite@caffeitalia.it",
        phone: "+39 06 99887",
        address: "Via Veneto 22, Roma",
      },
    }));

  // 8. Prodotti
  const products = [
    { sku: "BEV-001", name: "Acqua naturale 0.5L", cat: catBevande.id, sup: fornitoreA?.id, unit: "bt", cost: 0.25, sell: 1.5, min: 24 },
    { sku: "BEV-002", name: "Acqua frizzante 0.5L", cat: catBevande.id, sup: fornitoreA?.id, unit: "bt", cost: 0.28, sell: 1.5, min: 24 },
    { sku: "BEV-003", name: "Coca-Cola 0.33L lattina", cat: catBevande.id, sup: fornitoreA?.id, unit: "lat", cost: 0.6, sell: 2.5, min: 24 },
    { sku: "BEV-004", name: "Sprite 0.33L lattina", cat: catBevande.id, sup: fornitoreA?.id, unit: "lat", cost: 0.6, sell: 2.5, min: 12 },
    { sku: "BEV-005", name: "Succo arancia 0.2L", cat: catBevande.id, sup: fornitoreA?.id, unit: "bt", cost: 0.7, sell: 2.8, min: 12 },
    { sku: "CAF-001", name: "Caffè in grani Arabica 1kg", cat: catCaffe.id, sup: fornitoreB?.id, unit: "kg", cost: 12, sell: 30, min: 5 },
    { sku: "CAF-002", name: "Caffè decaffeinato 1kg", cat: catCaffe.id, sup: fornitoreB?.id, unit: "kg", cost: 14, sell: 32, min: 2 },
    { sku: "CAF-003", name: "Tè verde bustine x100", cat: catCaffe.id, sup: fornitoreB?.id, unit: "cf", cost: 6, sell: 15, min: 3 },
    { sku: "FOO-001", name: "Cornetto vuoto", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 0.4, sell: 1.5, min: 30 },
    { sku: "FOO-002", name: "Tramezzino prosciutto", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 1.2, sell: 3.5, min: 20 },
    { sku: "FOO-003", name: "Panino salame", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 1.5, sell: 4, min: 15 },
    { sku: "FOO-004", name: "Insalatona mista", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 2, sell: 7, min: 10 },
    { sku: "FOO-005", name: "Tiramisù monoporzione", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 1.8, sell: 4.5, min: 8 },
    { sku: "BEV-006", name: "Birra artigianale 0.33L", cat: catBevande.id, sup: fornitoreA?.id, unit: "bt", cost: 1.5, sell: 5, min: 24 },
    { sku: "BEV-007", name: "Vino bianco 0.75L", cat: catBevande.id, sup: fornitoreA?.id, unit: "bt", cost: 4, sell: 14, min: 6 },
    { sku: "BEV-008", name: "Spritz pre-mix 1L", cat: catBevande.id, sup: fornitoreA?.id, unit: "bt", cost: 6, sell: 22, min: 3 },
    { sku: "CAF-004", name: "Zucchero bustine x500", cat: catCaffe.id, sup: fornitoreA?.id, unit: "cf", cost: 3, sell: 8, min: 5 },
    { sku: "CAF-005", name: "Latte UHT 1L", cat: catBevande.id, sup: fornitoreA?.id, unit: "lt", cost: 1.1, sell: 2.5, min: 12 },
    { sku: "FOO-006", name: "Pizzetta margherita", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 0.9, sell: 3, min: 15 },
    { sku: "FOO-007", name: "Croissant cioccolato", cat: catFood.id, sup: fornitoreA?.id, unit: "pz", cost: 0.55, sell: 2, min: 25 },
  ];

  console.log(`Creating ${products.length} products...`);
  for (const p of products) {
    await prisma.product.upsert({
      where: { clientId_sku: { clientId: demo.id, sku: p.sku } },
      create: {
        clientId: demo.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        categoryId: p.cat,
        supplierId: p.sup ?? null,
        costPrice: new Prisma.Decimal(p.cost),
        sellPrice: new Prisma.Decimal(p.sell),
        vatRate: new Prisma.Decimal(22),
        minStock: new Prisma.Decimal(p.min),
        currentStock: new Prisma.Decimal(0),
      },
      update: {},
    });
  }

  // 9. Carico iniziale (movimento LOAD per ogni prodotto)
  const allProducts = await prisma.product.findMany({ where: { clientId: demo.id } });
  for (const p of allProducts) {
    const initialQty = new Prisma.Decimal(Math.ceil(Number(p.minStock) * (1 + Math.random() * 2)));
    const haveMovement = await prisma.stockMovement.findFirst({
      where: { clientId: demo.id, productId: p.id, type: "LOAD" },
    });
    if (haveMovement) continue;

    await prisma.stockMovement.create({
      data: {
        clientId: demo.id,
        productId: p.id,
        type: "LOAD",
        quantity: initialQty,
        unitCost: p.costPrice,
        userId: adminUser.id,
        note: "Carico iniziale (seed)",
      },
    });
    await prisma.product.update({
      where: { id: p.id },
      data: { currentStock: initialQty },
    });
  }
  console.log("✅ Carichi iniziali creati");

  // 10. Movimenti UNLOAD storici (8 settimane di consumo per forecast)
  const now = Date.now();
  const consumptionMovements: Prisma.StockMovementCreateManyInput[] = [];
  for (const p of allProducts) {
    const baseDaily = Number(p.minStock) / 5;
    for (let day = 56; day >= 1; day--) {
      if (Math.random() < 0.3) continue;
      const qty = Math.max(0.5, baseDaily * (0.7 + Math.random() * 0.6));
      consumptionMovements.push({
        clientId: demo.id,
        productId: p.id,
        type: "UNLOAD",
        quantity: new Prisma.Decimal(qty.toFixed(2)),
        userId: adminUser.id,
        createdAt: new Date(now - day * 24 * 3600 * 1000),
      });
    }
  }
  await prisma.stockMovement.createMany({ data: consumptionMovements });

  // ricalcola currentStock
  for (const p of allProducts) {
    const sumLoad = await prisma.stockMovement.aggregate({
      where: { clientId: demo.id, productId: p.id, type: "LOAD" },
      _sum: { quantity: true },
    });
    const sumOut = await prisma.stockMovement.aggregate({
      where: { clientId: demo.id, productId: p.id, type: { in: ["UNLOAD", "WASTE"] } },
      _sum: { quantity: true },
    });
    const newStock = (Number(sumLoad._sum.quantity ?? 0) - Number(sumOut._sum.quantity ?? 0)).toFixed(2);
    await prisma.product.update({
      where: { id: p.id },
      data: { currentStock: new Prisma.Decimal(Math.max(0, parseFloat(newStock))) },
    });
  }
  console.log(`✅ ${consumptionMovements.length} movimenti consumo creati`);

  // 11. HACCP demo: 2 frigo + qualche lotto
  const fridge1 = await prisma.fridge.upsert({
    where: { clientId_name: { clientId: demo.id, name: "Frigo bancone" } },
    create: { clientId: demo.id, name: "Frigo bancone", location: "Sala", minTemp: new Prisma.Decimal(2), maxTemp: new Prisma.Decimal(6) },
    update: {},
  });
  const fridge2 = await prisma.fridge.upsert({
    where: { clientId_name: { clientId: demo.id, name: "Cella retro" } },
    create: { clientId: demo.id, name: "Cella retro", location: "Magazzino", minTemp: new Prisma.Decimal(0), maxTemp: new Prisma.Decimal(4) },
    update: {},
  });
  for (let i = 0; i < 14; i++) {
    await prisma.fridgeReading.create({
      data: {
        clientId: demo.id,
        fridgeId: fridge1.id,
        temperature: new Prisma.Decimal((3 + Math.random() * 2).toFixed(1)),
        userId: adminUser.id,
        recordedAt: new Date(now - i * 24 * 3600 * 1000),
      },
    });
    await prisma.fridgeReading.create({
      data: {
        clientId: demo.id,
        fridgeId: fridge2.id,
        temperature: new Prisma.Decimal((1 + Math.random() * 2.5).toFixed(1)),
        userId: adminUser.id,
        recordedAt: new Date(now - i * 24 * 3600 * 1000),
      },
    });
  }
  console.log("✅ HACCP demo creato");

  console.log("\n🎉 Seed completato!\n");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│ Login URL: http://localhost:3000/login      │");
  console.log("├─────────────────────────────────────────────┤");
  console.log("│ Super-admin (lascia tenant vuoto):          │");
  console.log("│   admin@gestionale.local / admin123         │");
  console.log("├─────────────────────────────────────────────┤");
  console.log("│ Cliente demo (tenant: 'demo'):              │");
  console.log("│   admin@bardemo.it / demo1234               │");
  console.log("│   staff@bardemo.it / staff1234              │");
  console.log("└─────────────────────────────────────────────┘\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
