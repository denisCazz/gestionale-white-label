"use server";

import { prisma } from "@core/lib/prisma";
import { requireSuperAdmin } from "@core/lib/guards";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  await requireSuperAdmin();
  if (!newPassword || newPassword.length < 6) {
    return { error: "La password deve essere di almeno 6 caratteri" };
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string) {
  await requireSuperAdmin();
  // Impedisci l'eliminazione del proprio account
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return { error: "Utente non trovato" };
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  return { ok: true };
}
