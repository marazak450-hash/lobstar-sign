/**
 * cart.js – Cart page logic.
 */

async function loadCart() {
  const container = document.getElementById("cart-container");
  const summary = document.getElementById("cart-summary");

  if (!getToken()) {
    container.textContent = "Please log in to view your cart.";
    return;
  }

  try {
    const { items, total } = await apiFetch("/cart");
    container.innerHTML = "";

    if (!items.length) {
      container.textContent = "Your cart is empty.";
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const info = document.createElement("div");
      const nameEl = document.createElement("strong");
      nameEl.textContent = item.name;
      const priceEl = document.createElement("div");
      priceEl.textContent = `$${parseFloat(item.price).toFixed(2)} each`;
      info.append(nameEl, priceEl);

      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = 0;
      qtyInput.max = 100;
      qtyInput.value = item.quantity;
      qtyInput.className = "input";
      qtyInput.style.width = "70px";
      qtyInput.addEventListener("change", async () => {
        const qty = parseInt(qtyInput.value, 10);
        if (isNaN(qty) || qty < 0) { qtyInput.value = item.quantity; return; }
        try {
          await apiFetch(`/cart/${item.productId}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity: qty }),
          });
          loadCart();
          updateCartCount();
        } catch (err) {
          alert(err.message);
        }
      });

      const lineTotal = document.createElement("div");
      lineTotal.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

      row.append(info, qtyInput, lineTotal);
      container.appendChild(row);
    });

    document.getElementById("cart-total-amount").textContent = `$${total.toFixed(2)}`;
    summary.style.display = "flex";

  } catch (err) {
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
    } catch (err) {
      alert(err.message);
    }
  });
});
