import { grocerySources } from "../data/grocerySources.js";

const scoreItem = (item, goals) => {
  const proteinScore = item.nutrients.protein * goals.proteinWeight;
  const fiberScore = item.nutrients.fiber * goals.fiberWeight;
  const caloriePenalty = item.nutrients.calories * goals.calorieWeight;
  return proteinScore + fiberScore - caloriePenalty;
};

const meetsBudget = (item, maxPrice) => item.price <= maxPrice;

export const queryGrocerySources = ({ goals, maxPrice, maxItemsPerStore }) => {
  return grocerySources.map((source) => {
    const rankedItems = source.items
      .filter((item) => meetsBudget(item, maxPrice))
      .map((item) => ({
        ...item,
        score: scoreItem(item, goals),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItemsPerStore);

    return {
      ...source,
      recommendedItems: rankedItems,
    };
  });
};

export const summarizeCart = (cartItems) => {
  return cartItems.reduce(
    (summary, item) => {
      summary.total += item.price;
      summary.protein += item.nutrients.protein;
      summary.fiber += item.nutrients.fiber;
      return summary;
    },
    { total: 0, protein: 0, fiber: 0 }
  );
};
