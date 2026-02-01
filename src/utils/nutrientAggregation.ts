export type NutrientKey =
  | "protein"
  | "carbs"
  | "fat"
  | "iron"
  | "magnesium"
  | "vitaminD";

export type MealLogEntry = {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  nutrients: Record<NutrientKey, number>;
};

export type AggregatedNutrients = {
  date: string;
  totals: Record<NutrientKey, number>;
};

const emptyTotals = (): Record<NutrientKey, number> => ({
  protein: 0,
  carbs: 0,
  fat: 0,
  iron: 0,
  magnesium: 0,
  vitaminD: 0,
});

export const aggregateMealLogsByDate = (
  mealLogs: MealLogEntry[],
): AggregatedNutrients[] => {
  const byDate = new Map<string, Record<NutrientKey, number>>();

  mealLogs.forEach((entry) => {
    const totals = byDate.get(entry.date) ?? emptyTotals();
    (Object.keys(totals) as NutrientKey[]).forEach((key) => {
      totals[key] += entry.nutrients[key] ?? 0;
    });
    byDate.set(entry.date, totals);
  });

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, totals }));
};

export const formatNutrientLabel = (key: NutrientKey): string => {
  switch (key) {
    case "protein":
      return "Protein";
    case "carbs":
      return "Carbohydrates";
    case "fat":
      return "Fat";
    case "iron":
      return "Iron";
    case "magnesium":
      return "Magnesium";
    case "vitaminD":
      return "Vitamin D";
    default:
      return key;
  }
};
