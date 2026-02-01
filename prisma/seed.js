const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "demo@dietapp.local",
      name: "Demo User",
      goals: {
        create: {
          description: "Maintain 2,000 calories with higher protein",
          targetCalories: 2000,
          targetProtein: 140,
          targetCarbs: 220,
          targetFat: 65,
          targetFiber: 28,
          targetSodium: 2300
        }
      }
    }
  });

  const oatmeal = await prisma.foodItem.create({
    data: {
      name: "Rolled Oats",
      brand: "Pantry",
      nutrientProfile: {
        create: {
          calories: 150,
          proteinGrams: 5,
          carbsGrams: 27,
          fatGrams: 3,
          fiberGrams: 4,
          sugarGrams: 1,
          sodiumMg: 0,
          potassiumMg: 150,
          calciumMg: 20,
          ironMg: 1.5
        }
      }
    }
  });

  const yogurt = await prisma.foodItem.create({
    data: {
      name: "Greek Yogurt",
      brand: "Plain",
      nutrientProfile: {
        create: {
          calories: 120,
          proteinGrams: 16,
          carbsGrams: 8,
          fatGrams: 3,
          sugarGrams: 6,
          sodiumMg: 60,
          calciumMg: 180
        }
      }
    }
  });

  await prisma.mealEntry.create({
    data: {
      userId: user.id,
      mealType: "BREAKFAST",
      loggedAt: new Date(),
      notes: "Post-workout breakfast",
      items: {
        create: [
          {
            foodItemId: oatmeal.id,
            servingSize: 1,
            servingUnit: "cup"
          },
          {
            foodItemId: yogurt.id,
            servingSize: 170,
            servingUnit: "grams"
          }
        ]
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
