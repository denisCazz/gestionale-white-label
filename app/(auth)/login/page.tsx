import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@core/lib/auth";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  if (session?.user) {
    if (session.user.role === "SUPER_ADMIN") redirect("/admin/clients");
    if (session.user.clientId) {
      const slug = await getSlugById(session.user.clientId);
      if (slug) redirect(`/t/${slug}/dashboard`);
    }
  }

  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
            G
          </div>
          <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={sp.next} initialError={sp.error} />
        </CardContent>
      </Card>
    </div>
  );
}

async function getSlugById(clientId: string): Promise<string | null> {
  const { prisma } = await import("@core/lib/prisma");
  const c = await prisma.client.findUnique({ where: { id: clientId }, select: { slug: true } });
  return c?.slug ?? null;
}
