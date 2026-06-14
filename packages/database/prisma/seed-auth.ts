// ==========================================
// MenuQR — Authentication Seed
// Creates the super admin, sample restaurants and their staff users.
// Run with: pnpm --filter @order-pro/database db:seed:auth
// ==========================================

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

// NOTE: this password is used only to provision demo accounts. It matches the
// documented seed credentials and is never logged anywhere in the app.
const DEFAULT_PASSWORD = "Jd123004@";

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function upsertUser(params: {
  username: string;
  email: string | null;
  role: UserRole;
  restaurantId: string | null;
  password: string;
}): Promise<void> {
  const passwordHash = await hash(params.password);

  // Composite unique (username, restaurantId) — emulate upsert manually because
  // Prisma cannot target a unique that contains a nullable column directly.
  const existing = await prisma.user.findFirst({
    where: { username: params.username, restaurantId: params.restaurantId },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: params.email,
        role: params.role,
        passwordHash,
        isActive: true,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username: params.username,
        email: params.email,
        role: params.role,
        restaurantId: params.restaurantId,
        passwordHash,
        isActive: true,
      },
    });
  }

  console.log(`✅ User: ${params.username} (${params.role})`);
}

async function main() {
  console.log("🌱 Seeding MenuQR auth data...\n");

  // ==========================================
  // 1. SUPER ADMIN (no restaurant)
  // ==========================================
  await upsertUser({
    username: "superadmin",
    email: "superadmin@menuqr.app",
    role: "SUPER_ADMIN",
    restaurantId: null,
    password: DEFAULT_PASSWORD,
  });

  // ==========================================
  // 1.5. SUBSCRIPTION PLANS
  // ==========================================
  const defaultPlans = [
    { name: "Free Tier", price: "$0", tablesLimit: 3, ordersLimit: -1, targetAudience: "Hobbyists & Food Trucks", isPopular: false, features: ["3 Tables max", "Unlimited Orders"] },
    { name: "Starter", price: "$29", tablesLimit: 15, ordersLimit: -1, targetAudience: "Small Cafes", isPopular: false, features: ["15 Tables max", "Unlimited Orders", "Advanced Analytics"] },
    { name: "Pro", price: "$79", tablesLimit: 50, ordersLimit: -1, targetAudience: "Busy Restaurants", isPopular: true, badgeText: "Most Popular", badgeColor: "#8B5CF6", features: ["50 Tables max", "Unlimited Orders", "Advanced Analytics"] },
    { name: "Enterprise", price: "Custom", tablesLimit: -1, ordersLimit: -1, targetAudience: "Multi-location Brands", isPopular: false, features: ["Unlimited Tables", "Unlimited Orders", "Advanced Analytics"] },
  ];

  const createdPlans = [];
  for (const plan of defaultPlans) {
    const p = await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    createdPlans.push(p);
  }
  const freePlan = createdPlans.find(p => p.name === "Free Tier");

  // ==========================================
  // 1.75. FEATURE FLAGS
  // ==========================================
  const defaultFlags = [
    { key: "analytics", name: "Analytics Hub", description: "Access to advanced dashboard analytics.", defaultValue: false },
    { key: "inventory", name: "Inventory Management", description: "Track stock levels and ingredients.", defaultValue: false },
    { key: "whatsapp", name: "WhatsApp Integration", description: "Send order receipts via WhatsApp.", defaultValue: false },
    { key: "custom_domain", name: "Custom Domain", description: "White-label the QR menu with a custom URL.", defaultValue: false },
  ];

  for (const flag of defaultFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: flag,
    });
  }

  // ==========================================
  // 2. SAMPLE RESTAURANTS
  // ==========================================
  const restaurantSeed = [
    { name: "Pizza Palace", slug: "pizza-palace" },
    { name: "Burger Hub", slug: "burger-hub" },
  ];

  for (const r of restaurantSeed) {
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      update: { name: r.name, isActive: true },
      create: {
        name: r.name,
        slug: r.slug,
        themeColor: "#E8501A",
        currency: "USD",
        subscriptionPlanId: freePlan?.id,
        isActive: true,
      },
    });
    console.log(`\n✅ Restaurant: ${restaurant.name} (${restaurant.slug})`);

    const prefix = r.slug.replace(/-/g, "");

    // 1 restaurant admin
    await upsertUser({
      username: `${prefix}_admin`,
      email: `admin@${r.slug}.app`,
      role: "RESTAURANT_ADMIN",
      restaurantId: restaurant.id,
      password: DEFAULT_PASSWORD,
    });

    // 1 kitchen user
    await upsertUser({
      username: `${prefix}_kitchen`,
      email: null,
      role: "KITCHEN",
      restaurantId: restaurant.id,
      password: DEFAULT_PASSWORD,
    });

    // 1 waiter user
    await upsertUser({
      username: `${prefix}_waiter`,
      email: null,
      role: "WAITER",
      restaurantId: restaurant.id,
      password: DEFAULT_PASSWORD,
    });
  }

  console.log("\n🎉 MenuQR auth seed complete!");
  console.log("\n   Login credentials (all use password: Jd123004@)");
  console.log("   - superadmin            → SUPER_ADMIN");
  console.log("   - pizzapalace_admin     → RESTAURANT_ADMIN (Pizza Palace)");
  console.log("   - pizzapalace_kitchen   → KITCHEN (Pizza Palace)");
  console.log("   - pizzapalace_waiter    → WAITER (Pizza Palace)");
  console.log("   - burgerhub_admin       → RESTAURANT_ADMIN (Burger Hub)");
  console.log("   - burgerhub_kitchen     → KITCHEN (Burger Hub)");
  console.log("   - burgerhub_waiter      → WAITER (Burger Hub)");
}

main()
  .catch((e) => {
    console.error("❌ Auth seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
