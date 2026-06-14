import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Flame, WheatOff } from "lucide-react";

export type MenuItemData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  allergens: string[];
  tags: string[];
};

interface ItemCardProps {
  item: MenuItemData;
}

export default function ItemCard({ item }: ItemCardProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  // Find known dietary tags to map to icons
  const isVegan = item.tags.some(t => t.toLowerCase() === "vegan" || t.toLowerCase() === "vegetarian");
  const isSpicy = item.tags.some(t => t.toLowerCase() === "spicy");
  const isGlutenFree = item.allergens.some(a => a.toLowerCase() === "gluten-free");

  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow border border-outline-variant/10 flex flex-col h-full">
      <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-surface-container-high">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/50">
            No Image
          </div>
        )}
        
        {/* Dietary Tags Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isVegan && (
            <div className="bg-surface/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Leaf className="w-3.5 h-3.5 text-secondary" fill="currentColor" />
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Vegan</span>
            </div>
          )}
          {isSpicy && (
            <div className="bg-surface/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-error" fill="currentColor" />
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Spicy</span>
            </div>
          )}
          {isGlutenFree && (
            <div className="bg-surface/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <WheatOff className="w-3.5 h-3.5 text-[#d97706]" fill="currentColor" />
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">GF</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-semibold text-sm md:text-base text-on-surface line-clamp-1">{item.name}</h3>
          <span className="font-bold text-sm md:text-base text-primary whitespace-nowrap">
            {formatPrice(item.price)}
          </span>
        </div>
        
        <p className="text-body-sm text-on-surface-variant line-clamp-2 mb-3 flex-grow">
          {item.description}
        </p>
        
        <Link href={`/menu/item/${item.id}`} className="w-full mt-auto block">
          <button className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-2.5 rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95 shadow-sm">
            ADD TO CART
          </button>
        </Link>
      </div>
    </div>
  );
}
