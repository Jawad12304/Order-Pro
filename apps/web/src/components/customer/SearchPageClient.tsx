"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import ItemCard, { MenuItemData } from "./ItemCard";

export default function SearchPageClient({ initialItems }: { initialItems: MenuItemData[] }) {
  const [query, setQuery] = useState("");

  const filteredItems = initialItems.filter(item => {
    if (!query.trim()) return false;
    const lowerQuery = query.toLowerCase();
    return item.name.toLowerCase().includes(lowerQuery) || 
           (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
           item.tags.some(t => t.toLowerCase().includes(lowerQuery));
  });

  const displayItems = query.trim() ? filteredItems : initialItems;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-16 z-40 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/30 p-4">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            type="text"
            placeholder="Search for dishes, ingredients, or dietary tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-surface-container-highest border-none rounded-2xl text-body-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-inner transition-shadow"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <section className="px-margin-mobile mt-lg">
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {displayItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-title-lg font-bold text-on-surface mb-2">No results found</h3>
            <p className="text-body-md text-on-surface-variant">We couldn't find anything matching "{query}".</p>
          </div>
        )}
      </section>
    </div>
  );
}
