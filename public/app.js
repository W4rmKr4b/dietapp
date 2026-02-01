const form = document.getElementById("planner-form");
const deficitsInput = document.getElementById("deficits");
const goalInput = document.getElementById("goal");
const statusEl = document.getElementById("status");
const suggestionList = document.getElementById("suggestion-list");
const cartList = document.getElementById("cart-list");

const cartItems = new Map();

function setStatus(message) {
  statusEl.textContent = message;
}

function renderCart() {
  cartList.innerHTML = "";
  if (cartItems.size === 0) {
    cartList.innerHTML = "<li class=\"status\">Cart is empty</li>";
    return;
  }
  cartItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `<span>${item.name}</span><span>${item.quantity}</span>`;
    cartList.appendChild(li);
  });
}

function buildSuggestionItem(suggestion) {
  const li = document.createElement("li");
  li.className = "suggestion";

  const addButton = document.createElement("button");
  addButton.className = "add-btn";
  addButton.textContent = "Add to cart";

  addButton.addEventListener("click", () => {
    cartItems.set(suggestion.addToCartSku, suggestion);
    addButton.textContent = "Added";
    addButton.classList.add("added");
    renderCart();
  });

  li.innerHTML = `
    <div class="suggestion__header">
      <span class="suggestion__title">${suggestion.name}</span>
      <span class="suggestion__meta">${suggestion.quantity}</span>
    </div>
    <p>${suggestion.reason}</p>
    <div class="suggestion__meta">Key nutrients: ${suggestion.nutrients.join(", ")}</div>
  `;

  const header = li.querySelector(".suggestion__header");
  header.appendChild(addButton);

  return li;
}

async function fetchSuggestions(deficits, goalText) {
  const response = await fetch("/api/next-week-suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      deficits,
      goalText
    })
  });

  if (!response.ok) {
    const errorPayload = await response.json();
    throw new Error(errorPayload.error || "Failed to fetch suggestions");
  }

  return response.json();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  suggestionList.innerHTML = "";

  const deficits = deficitsInput.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const goalText = goalInput.value.trim();

  if (deficits.length === 0 || !goalText) {
    setStatus("Please enter deficits and a goal.");
    return;
  }

  setStatus("Fetching suggestions...");
  form.querySelector("button").disabled = true;

  try {
    const data = await fetchSuggestions(deficits, goalText);
    data.suggestions.forEach((suggestion) => {
      suggestionList.appendChild(buildSuggestionItem(suggestion));
    });
    setStatus("Suggestions ready");
  } catch (error) {
    setStatus("Unable to load suggestions.");
    suggestionList.innerHTML = `<li class=\"status\">${error.message}</li>`;
  } finally {
    form.querySelector("button").disabled = false;
  }
});

renderCart();
