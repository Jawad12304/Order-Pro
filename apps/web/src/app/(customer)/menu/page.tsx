import React, { Suspense } from "react";
import { headers } from "next/headers";
import { prisma } from "@order-pro/database";
import ItemCard from "@/components/customer/ItemCard";

// Skeleton Loader
function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mt-lg animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-surface-container-low rounded-xl h-64 border border-outline-variant/10"></div>
      ))}
    </div>
  );
}

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = host.split(".")[0];
  const { table, token, restaurantId: queryRestaurantId } = await searchParams;

  // We should save the table and token in context (client-side) later.
  // For now, let's fetch the menu.
  
  let restaurant = null;
  
  // First try to find by ID if provided (for Preview button)
  if (queryRestaurantId && typeof queryRestaurantId === "string") {
    restaurant = await prisma.restaurant.findUnique({
      where: { id: queryRestaurantId },
      include: {
        categories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
        menuItems: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  }
  
  // Fallback to subdomain matching
  if (!restaurant) {
    restaurant = await prisma.restaurant.findUnique({
      where: { slug: subdomain },
      include: {
        categories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
        menuItems: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  }

  if (!restaurant) {
    return <div className="p-8 text-center">Restaurant not found</div>;
  }

  // Group items by category for easy rendering
  // The provided HTML shows a horizontal scroll nav for categories.
  
  return (
    <>
      <nav className="sticky top-16 z-40 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/30">
        <div className="flex overflow-x-auto hide-scrollbar px-margin-mobile py-4 gap-sm items-center">
          <button className="flex-none px-lg py-2 rounded-full bg-primary text-on-primary font-title-md text-title-md shadow-md transition-all">
            All
          </button>
          {restaurant.categories.map((cat) => (
            <button key={cat.id} className="flex-none px-lg py-2 rounded-full bg-surface-container-high text-on-surface-variant font-title-md text-title-md hover:bg-surface-variant transition-colors">
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      <section className="px-margin-mobile mt-lg">
        <Suspense fallback={<MenuSkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {restaurant.menuItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </Suspense>
      </section>
    </>
  );
}
