export type ModuleDef = {
  key: string;
  name: string;
  description: string;
  icon: string;
  isPaid: boolean;
  category: "core" | "extra";
  priceMonthly?: number;
  routes: { path: string; label: string }[];
  navOrder: number;
};

export const MODULES: ModuleDef[] = [
  {
    key: "stock",
    name: "Magazzino",
    description: "Gestione prodotti, fornitori, carico/scarico, inventario",
    icon: "Package",
    isPaid: false,
    category: "core",
    routes: [
      { path: "/magazzino", label: "Magazzino" },
      { path: "/fornitori", label: "Fornitori" },
    ],
    navOrder: 10,
  },
  {
    key: "low-stock-alerts",
    name: "Avvisi sottoscorta",
    description:
      "Notifiche automatiche quando i prodotti scendono sotto la soglia minima impostata",
    icon: "BellRing",
    isPaid: true,
    category: "extra",
    priceMonthly: 9.9,
    routes: [{ path: "/avvisi", label: "Avvisi" }],
    navOrder: 20,
  },
  {
    key: "ai-forecast",
    name: "Previsione AI",
    description: "Previsione consumi e suggerimenti di riordino basati sullo storico",
    icon: "Sparkles",
    isPaid: true,
    category: "extra",
    priceMonthly: 19.9,
    routes: [{ path: "/forecast", label: "Previsioni" }],
    navOrder: 30,
  },
  {
    key: "supplier-orders",
    name: "Ordini fornitori",
    description: "Bozze d'ordine automatiche per prodotti sottoscorta + invio email al fornitore",
    icon: "Truck",
    isPaid: true,
    category: "extra",
    priceMonthly: 14.9,
    routes: [{ path: "/ordini", label: "Ordini" }],
    navOrder: 40,
  },
  {
    key: "haccp",
    name: "HACCP",
    description: "Lotti, scadenze, registro temperature frigo, export PDF per controlli sanitari",
    icon: "ShieldCheck",
    isPaid: true,
    category: "extra",
    priceMonthly: 24.9,
    routes: [{ path: "/haccp", label: "HACCP" }],
    navOrder: 50,
  },
  {
    key: "reports",
    name: "Report avanzati",
    description: "Dashboard analytics, top prodotti, margini, export CSV",
    icon: "BarChart3",
    isPaid: true,
    category: "extra",
    priceMonthly: 12.9,
    routes: [{ path: "/report", label: "Report" }],
    navOrder: 60,
  },
];

export const MODULES_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m]));

export function getModule(key: string): ModuleDef | undefined {
  return MODULES_BY_KEY[key];
}

export function getEnabledModules(enabledKeys: string[]): ModuleDef[] {
  return MODULES.filter((m) => !m.isPaid || enabledKeys.includes(m.key));
}
