import { queryGrocerySources, summarizeCart } from "./services/groceryService.js";

const state = {
  goals: {
    proteinWeight: 1.5,
    fiberWeight: 1,
    calorieWeight: 0.2,
  },
  maxPrice: 8,
  maxItemsPerStore: 3,
  cart: [],
};

const formatCurrency = (value) => `$${value.toFixed(2)}`;

const updateValue = (input, formatter, targetId) => {
  const target = document.getElementById(targetId);
  target.textContent = formatter(parseFloat(input.value));
};

const buildGoalPayload = () => ({
  goals: state.goals,
  maxPrice: state.maxPrice,
  maxItemsPerStore: state.maxItemsPerStore,
});

const renderRecommendations = () => {
  const container = document.getElementById("recommendations");
  const sources = queryGrocerySources(buildGoalPayload());

  container.innerHTML = sources
    .map((source) => {
      const items = source.recommendedItems
        .map((item) => {
          const inCart = state.cart.some((cartItem) => cartItem.id === item.id);
          return `
            <div class="item ${item.deal ? "deal" : ""}">
              <div class="item-row">
                <div>
                  <div class="item-title">${item.name}</div>
                  <div class="muted">${formatCurrency(item.price)} • Score ${item.score.toFixed(1)}</div>
                </div>
                <button class="${inCart ? "secondary" : "primary"}" data-action="${
            inCart ? "remove" : "add"
          }" data-id="${item.id}" data-source="${source.id}">
                  ${inCart ? "Remove" : "Add"}
                </button>
              </div>
              <div class="tag-row">
                <span class="tag">Protein ${item.nutrients.protein}g</span>
                <span class="tag">Fiber ${item.nutrients.fiber}g</span>
                <span class="tag">${item.nutrients.calories} kcal</span>
                ${item.deal ? '<span class="deal-badge">Deal</span>' : ""}
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="store">
          <div class="store-header">
            <strong>${source.name}</strong>
            <span class="muted">Delivery ${formatCurrency(source.deliveryFee)}</span>
          </div>
          ${items || '<p class="muted">No items match the current filters.</p>'}
        </div>
      `;
    })
    .join("");
};

const renderCart = () => {
  const container = document.getElementById("cart");
  const summary = summarizeCart(state.cart);

  const summaryMarkup = `
    <div class="cart-summary">
      <div class="item-row">
        <strong>Total</strong>
        <span>${formatCurrency(summary.total)}</span>
      </div>
      <div class="item-row muted">
        <span>Protein</span>
        <span>${summary.protein}g</span>
      </div>
      <div class="item-row muted">
        <span>Fiber</span>
        <span>${summary.fiber}g</span>
      </div>
    </div>
  `;

  const itemsMarkup = state.cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <div class="item-title">${item.name}</div>
            <div class="muted">${item.storeName} • ${formatCurrency(item.price)}</div>
          </div>
          <button class="secondary" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      `
    )
    .join("");

  container.innerHTML = summaryMarkup + (itemsMarkup || '<p class="muted">No items yet. Add recommendations to build your cart.</p>');
};

const refresh = () => {
  renderRecommendations();
  renderCart();
};

const addToCart = (itemId, sourceId) => {
  const sources = queryGrocerySources(buildGoalPayload());
  const source = sources.find((entry) => entry.id === sourceId);
  const item = source?.recommendedItems.find((entry) => entry.id === itemId);
  if (!item) return;

  state.cart = [...state.cart, { ...item, storeName: source.name }];
  refresh();
};

const removeFromCart = (itemId) => {
  state.cart = state.cart.filter((item) => item.id !== itemId);
  refresh();
};

const bindControls = () => {
  const proteinWeight = document.getElementById("proteinWeight");
  const fiberWeight = document.getElementById("fiberWeight");
  const calorieWeight = document.getElementById("calorieWeight");
  const maxPrice = document.getElementById("maxPrice");
  const maxItemsPerStore = document.getElementById("maxItemsPerStore");

  proteinWeight.addEventListener("input", () => {
    state.goals.proteinWeight = parseFloat(proteinWeight.value);
    updateValue(proteinWeight, (value) => `${value.toFixed(1)}x`, "proteinWeightValue");
    refresh();
  });

  fiberWeight.addEventListener("input", () => {
    state.goals.fiberWeight = parseFloat(fiberWeight.value);
    updateValue(fiberWeight, (value) => `${value.toFixed(1)}x`, "fiberWeightValue");
    refresh();
  });

  calorieWeight.addEventListener("input", () => {
    state.goals.calorieWeight = parseFloat(calorieWeight.value);
    updateValue(calorieWeight, (value) => `${value.toFixed(2)}x`, "calorieWeightValue");
    refresh();
  });

  maxPrice.addEventListener("input", () => {
    state.maxPrice = parseFloat(maxPrice.value);
    updateValue(maxPrice, (value) => formatCurrency(value), "maxPriceValue");
    refresh();
  });

  maxItemsPerStore.addEventListener("input", () => {
    state.maxItemsPerStore = parseInt(maxItemsPerStore.value, 10);
    updateValue(maxItemsPerStore, (value) => value, "maxItemsPerStoreValue");
    refresh();
  });
};

const bindActions = () => {
  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const itemId = button.dataset.id;
    const sourceId = button.dataset.source;

    if (action === "add" && sourceId) {
      addToCart(itemId, sourceId);
      return;
    }

    if (action === "remove") {
      removeFromCart(itemId);
    }
  });
};

bindControls();
bindActions();
refresh();
