import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ==========================================
  // 1. RESTAURANT
  // ==========================================
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "the-golden-fork" },
    update: {},
    create: {
      name: "The Golden Fork",
      slug: "the-golden-fork",
      logoUrl: null,
      themeColor: "#F97316",
      currency: "USD",
      subscriptionPlan: "PRO",
      isActive: true,
      settingsJson: {
        taxRate: 0.08,
        serviceCharge: 0.0,
        operatingHours: {
          monday: { open: "11:00", close: "22:00" },
          tuesday: { open: "11:00", close: "22:00" },
          wednesday: { open: "11:00", close: "22:00" },
          thursday: { open: "11:00", close: "23:00" },
          friday: { open: "11:00", close: "23:30" },
          saturday: { open: "10:00", close: "23:30" },
          sunday: { open: "10:00", close: "21:00" },
        },
        allowSpecialInstructions: true,
        autoAcceptOrders: false,
      },
    },
  });
  console.log(`✅ Restaurant: ${restaurant.name} (${restaurant.id})`);

  // ==========================================
  // 2. TABLES (6 tables)
  // ==========================================
  const tableData = [
    { number: 1, capacity: 2, status: "AVAILABLE" as const },
    { number: 2, capacity: 4, status: "OCCUPIED" as const },
    { number: 3, capacity: 4, status: "AVAILABLE" as const },
    { number: 4, capacity: 6, status: "RESERVED" as const },
    { number: 5, capacity: 8, status: "AVAILABLE" as const },
    { number: 6, capacity: 2, status: "AVAILABLE" as const },
  ];

  const tables = [];
  for (const t of tableData) {
    const table = await prisma.table.upsert({
      where: {
        restaurantId_number: {
          restaurantId: restaurant.id,
          number: t.number,
        },
      },
      update: { status: t.status, capacity: t.capacity },
      create: {
        restaurantId: restaurant.id,
        number: t.number,
        capacity: t.capacity,
        status: t.status,
        qrCodeUrl: `https://orderpro.app/qr/${restaurant.slug}/table-${t.number}`,
      },
    });
    tables.push(table);
  }
  console.log(`✅ Tables: ${tables.length} created`);

  // ==========================================
  // 3. CATEGORIES (4 categories)
  // ==========================================
  // Delete existing categories to avoid duplicate sortOrder issues
  await prisma.category.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  const appetizersCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Appetizers",
      description: "Start your meal with these delightful bites",
      sortOrder: 1,
      isVisible: true,
    },
  });

  const mainsCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Main Course",
      description: "Hearty entrées crafted with care",
      sortOrder: 2,
      isVisible: true,
    },
  });

  const dessertsCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Desserts",
      description: "Sweet finishes to your perfect meal",
      sortOrder: 3,
      isVisible: true,
    },
  });

  const beveragesCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Beverages",
      description: "Refreshing drinks and specialty cocktails",
      sortOrder: 4,
      isVisible: true,
    },
  });

  console.log(`✅ Categories: 4 created`);

  // ==========================================
  // 4. MENU ITEMS (12 items)
  // ==========================================
  // Clear old items (cascade will handle modifier group links)
  await prisma.menuItem.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  // Appetizers
  const bruschetta = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: appetizersCategory.id,
      name: "Bruschetta Trio",
      description: "Grilled sourdough topped with tomato basil, mushroom truffle, and ricotta honey.",
      price: 12.99,
      isAvailable: true,
      prepTimeMins: 8,
      allergens: ["Gluten", "Dairy"],
      tags: ["Vegetarian", "Shareable"],
      sortOrder: 1,
    },
  });

  const calamari = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: appetizersCategory.id,
      name: "Crispy Calamari",
      description: "Tender squid rings lightly fried, served with lemon aioli and marinara.",
      price: 14.50,
      isAvailable: true,
      prepTimeMins: 10,
      allergens: ["Gluten", "Shellfish"],
      tags: ["Popular"],
      sortOrder: 2,
    },
  });

  const edamame = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: appetizersCategory.id,
      name: "Spicy Garlic Edamame",
      description: "Steamed edamame tossed in chili garlic butter with sea salt.",
      price: 8.99,
      isAvailable: true,
      prepTimeMins: 5,
      allergens: ["Soy"],
      tags: ["Vegan", "Spicy", "Quick Bite"],
      sortOrder: 3,
    },
  });

  // Main Course
  const truffleBurger = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: mainsCategory.id,
      name: "Truffle Smash Burger",
      description: "Double smashed wagyu patties, aged gruyère, truffle aioli, caramelized onions on brioche.",
      price: 22.99,
      isAvailable: true,
      prepTimeMins: 15,
      allergens: ["Gluten", "Dairy", "Eggs"],
      tags: ["Chef's Special", "Popular"],
      sortOrder: 1,
    },
  });

  const salmonFillet = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: mainsCategory.id,
      name: "Pan-Seared Salmon",
      description: "Atlantic salmon fillet with lemon dill sauce, roasted asparagus, and wild rice.",
      price: 28.99,
      isAvailable: true,
      prepTimeMins: 18,
      allergens: ["Fish"],
      tags: ["Healthy", "Gluten-Free"],
      sortOrder: 2,
    },
  });

  const ribeye = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: mainsCategory.id,
      name: "12oz Ribeye Steak",
      description: "Prime-grade ribeye, herb butter, truffle mashed potatoes, grilled broccolini.",
      price: 42.99,
      isAvailable: true,
      prepTimeMins: 25,
      allergens: ["Dairy"],
      tags: ["Premium", "Chef's Special"],
      sortOrder: 3,
    },
  });

  const mushRisotto = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: mainsCategory.id,
      name: "Wild Mushroom Risotto",
      description: "Arborio rice with porcini, shiitake, and oyster mushrooms, finished with parmesan.",
      price: 19.99,
      isAvailable: true,
      prepTimeMins: 20,
      allergens: ["Dairy"],
      tags: ["Vegetarian"],
      sortOrder: 4,
    },
  });

  // Desserts
  const lavaCake = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: dessertsCategory.id,
      name: "Chocolate Lava Cake",
      description: "Warm Valrhona chocolate cake with a molten center, vanilla bean gelato.",
      price: 13.99,
      isAvailable: true,
      prepTimeMins: 12,
      allergens: ["Gluten", "Dairy", "Eggs"],
      tags: ["Popular", "Must Try"],
      sortOrder: 1,
    },
  });

  const tiramisu = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: dessertsCategory.id,
      name: "Classic Tiramisu",
      description: "Espresso-soaked ladyfingers layered with mascarpone cream and cocoa.",
      price: 11.99,
      isAvailable: true,
      prepTimeMins: 5,
      allergens: ["Gluten", "Dairy", "Eggs"],
      tags: [],
      sortOrder: 2,
    },
  });

  // Beverages
  const lemonade = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: beveragesCategory.id,
      name: "Fresh Squeezed Lemonade",
      description: "House-made lemonade with a hint of mint and raw honey.",
      price: 5.99,
      isAvailable: true,
      prepTimeMins: 3,
      allergens: [],
      tags: ["Refreshing", "Non-Alcoholic"],
      sortOrder: 1,
    },
  });

  const espresso = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: beveragesCategory.id,
      name: "Double Espresso",
      description: "Rich and bold Italian-style double shot.",
      price: 4.50,
      isAvailable: true,
      prepTimeMins: 2,
      allergens: [],
      tags: ["Hot", "Quick Bite"],
      sortOrder: 2,
    },
  });

  const smoothie = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: beveragesCategory.id,
      name: "Tropical Mango Smoothie",
      description: "Blended mango, pineapple, coconut milk, and a squeeze of lime.",
      price: 7.99,
      isAvailable: true,
      prepTimeMins: 4,
      allergens: [],
      tags: ["Vegan", "Refreshing"],
      sortOrder: 3,
    },
  });

  console.log(`✅ Menu Items: 12 created`);

  // ==========================================
  // 5. MODIFIER GROUPS & MODIFIERS
  // ==========================================
  await prisma.modifierGroup.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  // Size modifier group
  const sizeGroup = await prisma.modifierGroup.create({
    data: {
      restaurantId: restaurant.id,
      name: "Size",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      modifiers: {
        create: [
          { name: "Small", priceDelta: 0, isDefault: true, sortOrder: 1 },
          { name: "Medium", priceDelta: 2.0, isDefault: false, sortOrder: 2 },
          { name: "Large", priceDelta: 4.0, isDefault: false, sortOrder: 3 },
        ],
      },
    },
  });

  // Spice level modifier group
  const spiceGroup = await prisma.modifierGroup.create({
    data: {
      restaurantId: restaurant.id,
      name: "Spice Level",
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      modifiers: {
        create: [
          { name: "Mild", priceDelta: 0, isDefault: true, sortOrder: 1 },
          { name: "Medium", priceDelta: 0, isDefault: false, sortOrder: 2 },
          { name: "Hot", priceDelta: 0, isDefault: false, sortOrder: 3 },
          { name: "Extra Hot", priceDelta: 0.50, isDefault: false, sortOrder: 4 },
        ],
      },
    },
  });

  // Extra toppings modifier group
  const toppingsGroup = await prisma.modifierGroup.create({
    data: {
      restaurantId: restaurant.id,
      name: "Extra Toppings",
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      modifiers: {
        create: [
          { name: "Extra Cheese", priceDelta: 1.50, isDefault: false, sortOrder: 1 },
          { name: "Bacon", priceDelta: 2.50, isDefault: false, sortOrder: 2 },
          { name: "Avocado", priceDelta: 2.00, isDefault: false, sortOrder: 3 },
          { name: "Fried Egg", priceDelta: 1.50, isDefault: false, sortOrder: 4 },
          { name: "Jalapeños", priceDelta: 0.75, isDefault: false, sortOrder: 5 },
        ],
      },
    },
  });

  console.log(`✅ Modifier Groups: 3 created (with modifiers)`);

  // Link modifier groups to relevant menu items
  const menuItemModifierLinks = [
    // Truffle Burger gets Size + Toppings
    { menuItemId: truffleBurger.id, modifierGroupId: sizeGroup.id },
    { menuItemId: truffleBurger.id, modifierGroupId: toppingsGroup.id },
    // Edamame gets Spice Level
    { menuItemId: edamame.id, modifierGroupId: spiceGroup.id },
    // Lemonade gets Size
    { menuItemId: lemonade.id, modifierGroupId: sizeGroup.id },
    // Smoothie gets Size
    { menuItemId: smoothie.id, modifierGroupId: sizeGroup.id },
    // Risotto gets Spice Level
    { menuItemId: mushRisotto.id, modifierGroupId: spiceGroup.id },
  ];

  for (const link of menuItemModifierLinks) {
    await prisma.menuItemModifierGroup.create({ data: link });
  }

  console.log(`✅ Menu ↔ Modifier Links: ${menuItemModifierLinks.length} created`);

  // ==========================================
  // 6. STAFF (3 members)
  // ==========================================
  await prisma.staff.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  const staffData = [
    {
      name: "Sarah Mitchell",
      email: "sarah@goldenfork.com",
      role: "OWNER" as const,
      pin: "1234",
    },
    {
      name: "Marco Rossi",
      email: "marco@goldenfork.com",
      role: "CHEF" as const,
      pin: "5678",
    },
    {
      name: "Jake Thompson",
      email: null,
      role: "WAITER" as const,
      pin: "9012",
    },
  ];

  for (const s of staffData) {
    await prisma.staff.create({
      data: {
        restaurantId: restaurant.id,
        name: s.name,
        email: s.email,
        role: s.role,
        pin: s.pin,
        isActive: true,
      },
    });
  }
  console.log(`✅ Staff: 3 created`);

  // ==========================================
  // 7. TABLE SESSION (1 active session)
  // ==========================================
  await prisma.tableSession.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  const activeSession = await prisma.tableSession.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[1]!.id, // Table 2 (OCCUPIED)
      status: "ACTIVE",
      guestCount: 3,
      startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
  });
  console.log(`✅ Table Sessions: 1 active session`);

  // ==========================================
  // 8. SAMPLE ORDERS (2 orders)
  // ==========================================
  await prisma.order.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  // Order 1: PENDING — just placed
  const order1 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[1]!.id, // Table 2
      tableSessionId: activeSession.id,
      customerName: "Alice Chen",
      status: "PENDING",
      subtotalAmount: 37.48,
      taxAmount: 3.00,
      totalAmount: 40.48,
      notes: "Birthday celebration — please add a candle to the dessert!",
      items: {
        create: [
          {
            menuItemId: bruschetta.id,
            quantity: 1,
            unitPrice: 12.99,
            modifiersJson: null,
            specialInstructions: null,
          },
          {
            menuItemId: truffleBurger.id,
            quantity: 1,
            unitPrice: 24.49,
            modifiersJson: [
              { group: "Size", modifier: "Medium", priceDelta: 2.0 },
              { group: "Extra Toppings", modifier: "Avocado", priceDelta: 2.0 },
              { group: "Extra Toppings", modifier: "Bacon", priceDelta: 2.5 },
            ],
            specialInstructions: "No onions, please",
          },
        ],
      },
    },
  });

  // Order 2: PREPARING — already accepted and being cooked
  const order2 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[1]!.id, // Table 2
      tableSessionId: activeSession.id,
      customerName: "Alice Chen",
      status: "PREPARING",
      subtotalAmount: 33.98,
      taxAmount: 2.72,
      totalAmount: 36.70,
      items: {
        create: [
          {
            menuItemId: salmonFillet.id,
            quantity: 1,
            unitPrice: 28.99,
            modifiersJson: null,
            specialInstructions: "Medium well, extra lemon on the side",
          },
          {
            menuItemId: lemonade.id,
            quantity: 1,
            unitPrice: 5.99,
            modifiersJson: [
              { group: "Size", modifier: "Large", priceDelta: 4.0 },
            ],
            specialInstructions: null,
          },
        ],
      },
    },
  });
  console.log(`✅ Orders: 2 created (1 PENDING, 1 PREPARING)`);

  // ==========================================
  // DONE
  // ==========================================
  console.log("\n🎉 Database seeded successfully!");
  console.log(`   Restaurant: ${restaurant.name}`);
  console.log(`   Tables: ${tables.length}`);
  console.log(`   Menu Items: 12`);
  console.log(`   Modifier Groups: 3`);
  console.log(`   Staff: 3`);
  console.log(`   Sessions: 1`);
  console.log(`   Orders: 2`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
