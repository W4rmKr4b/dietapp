import { useMemo, useState } from "react";
import "./MealLogger.css";

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

type MealItem = {
  id: string;
  name: string;
  quantity: string;
  servingSize: string;
};

type MealFormState = {
  name: string;
  quantity: string;
  servingSize: string;
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

const emptyFormState: MealFormState = {
  name: "",
  quantity: "",
  servingSize: "",
};

const createBlankForms = (): Record<MealType, MealFormState> => ({
  breakfast: { ...emptyFormState },
  lunch: { ...emptyFormState },
  dinner: { ...emptyFormState },
  snacks: { ...emptyFormState },
});

const createBlankItems = (): Record<MealType, MealItem[]> => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: [],
});

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function MealLogger() {
  const [formState, setFormState] = useState(createBlankForms);
  const [itemsByMeal, setItemsByMeal] = useState(createBlankItems);
  const [saveState, setSaveState] = useState<Record<MealType, string>>({
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
  });
  const [isSaving, setIsSaving] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
  });

  const mealEntries = useMemo(() => Object.entries(MEAL_LABELS), []);

  const handleInputChange = (
    meal: MealType,
    field: keyof MealFormState,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  const handleAddItem = (meal: MealType) => {
    const currentForm = formState[meal];
    if (!currentForm.name.trim()) {
      setSaveState((prev) => ({
        ...prev,
        [meal]: "Add a food name before saving.",
      }));
      return;
    }

    const newItem: MealItem = {
      id: generateId(),
      name: currentForm.name.trim(),
      quantity: currentForm.quantity.trim(),
      servingSize: currentForm.servingSize.trim(),
    };

    setItemsByMeal((prev) => ({
      ...prev,
      [meal]: [...prev[meal], newItem],
    }));
    setFormState((prev) => ({
      ...prev,
      [meal]: { ...emptyFormState },
    }));
    setSaveState((prev) => ({
      ...prev,
      [meal]: "",
    }));
  };

  const handleSaveMeal = async (meal: MealType) => {
    const items = itemsByMeal[meal];
    if (items.length === 0) {
      setSaveState((prev) => ({
        ...prev,
        [meal]: "Add at least one food before saving.",
      }));
      return;
    }

    setIsSaving((prev) => ({ ...prev, [meal]: true }));
    setSaveState((prev) => ({ ...prev, [meal]: "" }));

    try {
      const response = await fetch("/api/meal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal, items }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setSaveState((prev) => ({
        ...prev,
        [meal]: "Saved successfully!",
      }));
    } catch (error) {
      setSaveState((prev) => ({
        ...prev,
        [meal]: "Unable to save. Please try again.",
      }));
    } finally {
      setIsSaving((prev) => ({ ...prev, [meal]: false }));
    }
  };

  return (
    <section className="meal-logger">
      <header className="meal-logger__header">
        <h2>Meal Logger</h2>
        <p>Track foods by meal and save each section to your log.</p>
      </header>

      <div className="meal-logger__grid">
        {mealEntries.map(([mealKey, label]) => {
          const meal = mealKey as MealType;
          const form = formState[meal];
          return (
            <article className="meal-card" key={meal}>
              <div className="meal-card__header">
                <h3>{label}</h3>
                <button
                  className="meal-card__save"
                  type="button"
                  onClick={() => handleSaveMeal(meal)}
                  disabled={isSaving[meal]}
                >
                  {isSaving[meal] ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="meal-card__form">
                <label>
                  Food
                  <input
                    type="text"
                    placeholder="e.g. Oatmeal"
                    value={form.name}
                    onChange={(event) =>
                      handleInputChange(meal, "name", event.target.value)
                    }
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={form.quantity}
                    onChange={(event) =>
                      handleInputChange(meal, "quantity", event.target.value)
                    }
                  />
                </label>
                <label>
                  Serving Size
                  <input
                    type="text"
                    placeholder="e.g. bowl"
                    value={form.servingSize}
                    onChange={(event) =>
                      handleInputChange(meal, "servingSize", event.target.value)
                    }
                  />
                </label>
                <button
                  className="meal-card__add"
                  type="button"
                  onClick={() => handleAddItem(meal)}
                >
                  Add Food
                </button>
              </div>

              <ul className="meal-card__list">
                {itemsByMeal[meal].length === 0 ? (
                  <li className="meal-card__empty">
                    No foods added yet.
                  </li>
                ) : (
                  itemsByMeal[meal].map((item) => (
                    <li key={item.id} className="meal-card__item">
                      <div>
                        <strong>{item.name}</strong>
                        {item.quantity && (
                          <span> · Qty: {item.quantity}</span>
                        )}
                        {item.servingSize && (
                          <span> · {item.servingSize}</span>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {saveState[meal] && (
                <p className="meal-card__status">{saveState[meal]}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
