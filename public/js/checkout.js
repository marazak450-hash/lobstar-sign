/**
 * checkout.js – Checkout page logic.
 */

async function loadOrderSummary() {
  const el = document.getElementById("order-summary");
  if (!getToken()) { window.location.href = "/login.html"; return; }

  try {
    const { items, total } = await apiFetch("/cart");
    el.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Order Summary";
    el.appendChild(title);

    if (!items.length) {
      el.textContent = "Your cart is empty.";
      document.getElementById("place-order-btn").disabled = true;
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:space-between;margin:.25rem 0";

      const name = document.createElement("span");
      name.textContent = `${item.name} x${item.quantity}`;
      const price = document.createElement("span");
      price.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

      row.append(name, price);
      el.appendChild(row);
    });

    const totalEl = document.createElement("p");
    totalEl.style.cssText = "font-weight:700;margin-top:.75rem";
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    el.appendChild(totalEl);
  } catch {
    el.textContent = "Could not load cart.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadOrderSummary();

  document.getElementById("checkout-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("checkout-error");
    errEl.style.display = "none";

    const btn = document.getElementById("place-order-btn");
    btn.disabled = true;
    btn.textContent = "Placing order…";

    try {
      const cart = await apiFetch("/cart");
      if (!cart.items.length) throw new Error("Your cart is empty.");

      const form = e.target;
      const shippingAddress = {
        street:     form.street.value.trim(),
        city:       form.city.value.trim(),
        postalCode: form.postalCode.value.trim(),
        country:    form.country.value.trim(),
      };

      const order = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({ items: cart.items, shippingAddress }),
      });

      // Clear cart after successful order
      await apiFetch("/cart", { method: "DELETE" });

      alert(`Order #${order.id} placed successfully! Status: ${order.status}`);
      window.location.href = "/";
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Place Order";
    }
  });
});
