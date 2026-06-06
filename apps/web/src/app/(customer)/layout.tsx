import React from "react";
import { headers } from "next/headers";
import { prisma } from "@order-pro/database";
import { CartProvider } from "@/context/CartContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import FloatingCartFab from "@/components/customer/FloatingCartFab";
import BottomNavigation from "@/components/customer/BottomNavigation";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = host.split(".")[0];
  
  // Also check query params if they exist, but layout doesn't easily get searchParams.
  // Host extraction is our primary multi-tenancy strategy.

  let themeColor = "#ab3500"; // Default primary
  let name = "Restaurant";
  
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: subdomain },
      select: { themeColor: true, name: true },
    });
    if (restaurant && restaurant.themeColor) {
      themeColor = restaurant.themeColor;
      name = restaurant.name;
    }
  } catch (error) {
    console.error("Failed to load restaurant theme", error);
  }

  // Very basic color math to derive a container color (lighten) and on-primary color
  // In a production app, we would use a library like `tinycolor2` to generate the full tonal palette.
  // For now, we apply the chosen color to primary, and a lighter version to primary-container.
  
  const customThemeStyle = `
    :root {
      --theme-primary: ${themeColor};
      --theme-on-primary: #ffffff;
      /* We could dynamically generate this, using a fallback for now */
      --theme-primary-container: ${themeColor}20; /* 20% opacity hex for container */
      --theme-on-primary-container: ${themeColor};
    }
  `;

  // For RTL support, check if an accept-language header prefers Arabic
  const acceptLanguage = headersList.get("accept-language") || "";
  const isArabic = acceptLanguage.toLowerCase().startsWith("ar");

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="bg-background text-on-surface w-full h-full min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: customThemeStyle }} />
        <QueryProvider>
          <CartProvider>
            {/* Top Navigation Shell */}
            <header className="bg-surface/70 dark:bg-surface/70 backdrop-blur-xl shadow-sm docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-margin-mobile h-16">
              <div className="flex items-center gap-sm">
                <h1 className="text-headline-lg-mobile font-headline-lg-mobile font-black text-primary dark:text-primary-fixed tracking-tight">
                  {name}
                </h1>
              </div>
              <div className="flex items-center gap-sm">
                <button className="text-label-caps font-label-caps text-primary hover:bg-surface-variant/50 transition-colors px-3 py-1 rounded-full active:scale-95 duration-100">
                  {isArabic ? "EN" : "AR"}
                </button>
              </div>
            </header>

            <main className="min-h-screen pb-32">
              {children}
            </main>

            <FloatingCartFab />
            <BottomNavigation />
          </CartProvider>
        </QueryProvider>
    </div>
  );
}
