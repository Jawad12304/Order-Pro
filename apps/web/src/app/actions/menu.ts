"use server";

import { prisma } from "@order-pro/database";
import { revalidatePath } from "next/cache";

export async function getCategories(restaurantId: string) {
  try {
    return await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function getMenuItems(restaurantId: string) {
  try {
    return await prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    return [];
  }
}

export async function updateMenuItemAvailability(id: string, isAvailable: boolean) {
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });
    revalidatePath("/dashboard/menu");
    return item;
  } catch (error) {
    console.error("Failed to update item availability:", error);
    throw new Error("Failed to update availability");
  }
}

export async function createCategory(data: { restaurantId: string; name: string }) {
  try {
    const lastCategory = await prisma.category.findFirst({
      where: { restaurantId: data.restaurantId },
      orderBy: { sortOrder: "desc" },
    });
    const sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;

    const category = await prisma.category.create({
      data: {
        ...data,
        sortOrder,
      },
    });
    revalidatePath("/dashboard/menu");
    return category;
  } catch (error) {
    console.error("Failed to create category:", error);
    throw new Error("Failed to create category");
  }
}

export async function updateCategorySortOrders(updates: { id: string; sortOrder: number }[]) {
  try {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.category.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );
    revalidatePath("/dashboard/menu");
  } catch (error) {
    console.error("Failed to update category sort order:", error);
    throw new Error("Failed to update sort order");
  }
}

export async function updateMenuItemSortOrders(updates: { id: string; sortOrder: number; categoryId: string }[]) {
  try {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.menuItem.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder, categoryId: update.categoryId },
        })
      )
    );
    revalidatePath("/dashboard/menu");
  } catch (error) {
    console.error("Failed to update item sort order:", error);
    throw new Error("Failed to update item order");
  }
}

export async function deleteMenuItems(ids: string[]) {
  try {
    await prisma.menuItem.deleteMany({
      where: { id: { in: ids } },
    });
    revalidatePath("/dashboard/menu");
  } catch (error) {
    console.error("Failed to delete items:", error);
    throw new Error("Failed to delete items");
  }
}

export async function createMenuItem(data: any) {
  try {
    const { restaurantId, modifierGroups, ...rest } = data;
    
    // Create the item
    const menuItem = await prisma.menuItem.create({
      data: {
        ...rest,
        restaurantId,
      }
    });

    // Handle modifier groups if provided
    // For simplicity we create new groups for the item. In a more complex setup, you'd link existing ones.
    if (modifierGroups && modifierGroups.length > 0) {
      for (const group of modifierGroups) {
        const createdGroup = await prisma.modifierGroup.create({
          data: {
            restaurantId,
            name: group.name,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            modifiers: {
              create: group.options.map((opt: any, index: number) => ({
                name: opt.name,
                priceDelta: opt.priceDelta,
                sortOrder: index
              }))
            }
          }
        });

        await prisma.menuItemModifierGroup.create({
          data: {
            menuItemId: menuItem.id,
            modifierGroupId: createdGroup.id
          }
        });
      }
    }

    revalidatePath("/dashboard/menu");
    return menuItem;
  } catch (error) {
    console.error("Failed to create menu item:", error);
    throw new Error("Failed to create menu item");
  }
}

export async function updateMenuItem(id: string, data: any) {
  try {
    const { restaurantId, modifierGroups, ...rest } = data;
    
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: rest
    });

    revalidatePath("/dashboard/menu");
    return menuItem;
  } catch (error) {
    console.error("Failed to update menu item:", error);
    throw new Error("Failed to update menu item");
  }
}
