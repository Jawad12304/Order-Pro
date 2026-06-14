"use server";

import { prisma } from "@order-pro/database";
import { revalidatePath } from "next/cache";

export async function getSuperAdminProfile(username: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { username, role: "SUPER_ADMIN" }
    });
    if (!user) throw new Error("Super Admin not found");

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      }
    };
  } catch (error: any) {
    console.error("Failed to get profile:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSuperAdminProfile(id: string, data: { displayName?: string, avatarUrl?: string }) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl
      }
    });
    revalidatePath("/superadmin/settings");
    revalidatePath("/superadmin");
    return { success: true, user };
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return { success: false, error: error.message };
  }
}

export async function changeSuperAdminPassword(id: string, currentPass: string, newPass: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");

    const bcrypt = await import("bcryptjs");
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Incorrect current password" };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPass, salt);

    // Update DB
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to change password:", error);
    return { success: false, error: error.message };
  }
}
