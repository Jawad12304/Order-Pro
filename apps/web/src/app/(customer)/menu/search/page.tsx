import React from "react";
import { headers } from "next/headers";
import { prisma } from "@order-pro/database";
import SearchPageClient from "@/components/customer/SearchPageClient";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = host.split(".")[0];
  const { restaurantId: queryRestaurantId } = await searchParams;

  let restaurant = null;
  
  if (queryRestaurantId && typeof queryRestaurantId === "string") {
    restaurant = await prisma.restaurant.findUnique({
      where: { id: queryRestaurantId },
      include: {
        menuItems: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  }
  
  if (!restaurant) {
    restaurant = await prisma.restaurant.findUnique({
      where: { slug: subdomain },
      include: {
        menuItems: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  }

  if (!restaurant) {
    return <div className="p-8 text-center">Restaurant not found</div>;
  }

  return <SearchPageClient initialItems={restaurant.menuItems} />;
}
