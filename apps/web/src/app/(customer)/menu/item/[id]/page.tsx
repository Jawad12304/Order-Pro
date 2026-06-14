import React from "react";
import { prisma } from "@order-pro/database";
import ItemDetailClient from "@/components/customer/ItemDetailClient";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const item = await prisma.menuItem.findUnique({
    where: { id },
  });

  if (!item) {
    return <div className="fixed inset-0 z-[100] bg-on-background/50 backdrop-blur-sm flex items-center justify-center text-white">Item not found</div>;
  }

  return <ItemDetailClient item={item} />;
}
