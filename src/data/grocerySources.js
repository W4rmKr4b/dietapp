export const grocerySources = [
  {
    id: "fresh-mart",
    name: "Fresh Mart",
    deliveryFee: 3.99,
    items: [
      {
        id: "fm-1",
        name: "Greek Yogurt Cups",
        price: 5.49,
        deal: true,
        nutrients: { protein: 20, fiber: 0, calories: 220 },
      },
      {
        id: "fm-2",
        name: "Steel Cut Oats",
        price: 4.79,
        deal: false,
        nutrients: { protein: 8, fiber: 6, calories: 150 },
      },
      {
        id: "fm-3",
        name: "Frozen Berries",
        price: 6.25,
        deal: true,
        nutrients: { protein: 2, fiber: 5, calories: 90 },
      },
    ],
  },
  {
    id: "budget-basket",
    name: "Budget Basket",
    deliveryFee: 1.5,
    items: [
      {
        id: "bb-1",
        name: "Canned Chickpeas",
        price: 1.29,
        deal: false,
        nutrients: { protein: 12, fiber: 7, calories: 210 },
      },
      {
        id: "bb-2",
        name: "Brown Rice",
        price: 2.49,
        deal: true,
        nutrients: { protein: 6, fiber: 3, calories: 180 },
      },
      {
        id: "bb-3",
        name: "Spinach",
        price: 2.1,
        deal: false,
        nutrients: { protein: 4, fiber: 4, calories: 40 },
      },
    ],
  },
  {
    id: "wellness-market",
    name: "Wellness Market",
    deliveryFee: 4.25,
    items: [
      {
        id: "wm-1",
        name: "Wild Salmon Fillets",
        price: 12.99,
        deal: true,
        nutrients: { protein: 30, fiber: 0, calories: 280 },
      },
      {
        id: "wm-2",
        name: "Quinoa Blend",
        price: 5.75,
        deal: false,
        nutrients: { protein: 9, fiber: 4, calories: 160 },
      },
      {
        id: "wm-3",
        name: "Avocado Pack",
        price: 4.95,
        deal: true,
        nutrients: { protein: 3, fiber: 7, calories: 220 },
      },
    ],
  },
];
