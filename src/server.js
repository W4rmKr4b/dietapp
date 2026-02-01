const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      goals: true,
      mealEntries: {
        include: {
          items: {
            include: {
              foodItem: {
                include: { nutrientProfile: true }
              }
            }
          }
        }
      }
    }
  });

  res.json(users);
});

app.get("/food-items", async (req, res) => {
  const items = await prisma.foodItem.findMany({
    include: { nutrientProfile: true }
  });

  res.json(items);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dietapp API listening on port ${port}`);
});
