"use client";

import { useEffect, useState } from "react";
import { getRestaurantId } from "@/lib/restaurant";

/**
 * Client-side hook that resolves the current restaurant ID on mount.
 * Caches the result so subsequent calls in the same page don't re-fetch.
 *
 * Usage:
 *   const { restaurantId, loading } = useRestaurantId();
 */

let cachedId: string | null = null;

export function useRestaurantId() {
  const [restaurantId, setRestaurantId] = useState<string | null>(cachedId);
  const [loading, setLoading] = useState(!cachedId);

  useEffect(() => {
    if (cachedId) {
      setRestaurantId(cachedId);
      setLoading(false);
      return;
    }

    getRestaurantId()
      .then((id) => {
        cachedId = id;
        setRestaurantId(id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { restaurantId, loading };
}
