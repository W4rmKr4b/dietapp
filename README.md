# Dietapp Backend Scaffold

This project provides a starter backend scaffold for a diet tracking app using Express + Prisma (SQLite).

## Quick start

```bash
npm install
```

Create a local SQLite database by setting the Prisma connection string:

```bash
cp .env.example .env
```

Run migrations and seed data:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Start the API:

```bash
npm run dev
```

## Data model overview

- **User** has many **MealEntry** records and **Goal** records.
- **MealEntry** logs the meal type and timestamp and connects to many **FoodItem** records through **MealEntryFoodItem**.
- **FoodItem** has a one-to-one **NutrientProfile** with macro + micro nutrients.
- **Goal** stores free-form text plus parsed target fields.

## Endpoints

- `GET /health`
- `GET /users`
- `GET /food-items`
