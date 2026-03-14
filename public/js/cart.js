/**
 * cart.js – Cart page logic.
 */

async function loadCart() {
  const container = document.getElementById("cart-container");
  const summaryBlock = document.getElementById("cart-summary-block");

  if (!getToken()) {
    container.innerHTML = "<div class='empty-state'><div class='empty-icon'>🔒</div><p>Please <a href='/login.html'>log in</a> to view your cart.</p></div>";
    return;
  }

  try {
    const { items, total } = await apiFetch("/cart");
    container.innerHTML = "";

    if (!items.length) {
      container.innerHTML = "<div class='empty-state'><div class='empty-icon'>🧶</div><p>Your cart is empty.<br><a href='/products.html' class='btn btn-primary' style='margin-top:1rem;display:inline-block'>Browse the Collection</a></p></div>";
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const emojiEl = document.createElement("div");
      emojiEl.className = "cart-item-emoji";
      emojiEl.textContent = "🧶";

      const info = document.createElement("div");
      info.className = "cart-item-info";
      const nameEl = document.createElement("strong");
      nameEl.textContent = item.name;
      const priceEl = document.createElement("small");
      priceEl.textContent = `$${parseFloat(item.price).toFixed(2)} per skein`;
      info.append(nameEl, document.createElement("br"), priceEl);

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = 0;
      qtyInput.max = 100;
      qtyInput.value = item.quantity;
      qtyInput.className = "input cart-item-qty";
      qtyInput.addEventListener("change", async () => {
        const qty = parseInt(qtyInput.value, 10);
        if (isNaN(qty) || qty < 0) { qtyInput.value = item.quantity; return; }
        try {
          await apiFetch(`/cart/${item.productId}`, { method: "PATCH", body: JSON.stringify({ quantity: qty }) });
          loadCart();
          updateCartCount();
        } catch (err) { alert(err.message); }
      });

      const lineTotal = document.createElement("div");
      lineTotal.className = "cart-item-total";
      lineTotal.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

      row.append(emojiEl, info, qtyInput, lineTotal);
      container.appendChild(row);
    });

    document.getElementById("cart-total-amount").textContent = `$${total.toFixed(2)}`;
    summaryBlock.style.display = "block";

  } catch {
    container.textContent = "Could not load cart.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();

  document.getElementById("clear-cart-btn")?.addEventListener("click", async () => {
    if (!confirm("Clear your entire cart?")) return;
    try {
      await apiFetch("/cart", { method: "DELETE" });
      loadCart();
      updateCartCount();
    } catch (err) { alert(err.message); }
  });
});
