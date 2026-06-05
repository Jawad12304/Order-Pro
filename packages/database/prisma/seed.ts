import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a default restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-diner" },
    update: {},
    create: {
      name: "Demo Diner",
      slug: "demo-diner",
    },
  });

  // Create tables
  const table1 = await prisma.table.upsert({
    where: {
      restaurantId_number: {
        restaurantId: restaurant.id,
        number: 1,
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      number: 1,
      qrCode: `qr-${restaurant.id}-1`,
    },
  });

  const table2 = await prisma.table.upsert({
    where: {
      restaurantId_number: {
        restaurantId: restaurant.id,
        number: 2,
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      number: 2,
      qrCode: `qr-${restaurant.id}-2`,
    },
  });

  // Create categories
  const burgersCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Burgers",
      sortOrder: 1,
    },
  });

  const drinksCategory = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Drinks",
      sortOrder: 2,
    },
  });

  // Create menu items
  const classicBurger = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: burgersCategory.id,
      name: "Classic Burger",
      description: "Beef patty with lettuce, tomato, and cheese.",
      price: 12.99,
      modifiers: {
        create: [
          { name: "Extra Cheese", price: 1.5 },
          { name: "Bacon", price: 2.0 },
        ],
      },
    },
  });

  const cola = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: drinksCategory.id,
      name: "Cola",
      description: "Refreshing cold cola.",
      price: 2.99,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
