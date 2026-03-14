/**
 * checkout.js
 */

async function loadOrderSummary() {
  const el = document.getElementById("order-summary-items");
  if (!getToken()) { window.location.href = "/login.html"; return; }

  try {
    const { items, total } = await apiFetch("/cart");
    el.innerHTML = "";

    if (!items.length) {
      el.innerHTML = "<p style='color:var(--muted)'>Your cart is empty.</p>";
      document.getElementById("place-order-btn").disabled = true;
      return;
    }

    items.forEach((item) => {
      const line = document.createElement("div");
      line.className = "order-line";
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = `${item.name} × ${item.quantity}`;
      const amt = document.createElement("span");
      amt.className = "amount";
      amt.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
      line.append(name, amt);
      el.appendChild(line);
    });

    const totLine = document.createElement("div");
    totLine.className = "order-total-line";
    const totLabel = document.createElement("span");
    totLabel.textContent = "Total";
    const totAmt = document.createElement("span");
    totAmt.textContent = `$${total.toFixed(2)}`;
    totAmt.style.color = "var(--terracotta)";
    totLine.append(totLabel, totAmt);
    el.appendChild(totLine);

    const note = document.createElement("p");
    note.style.cssText = "font-size:.78rem;color:var(--muted);margin-top:1rem;line-height:1.6";
    note.textContent = "Free shipping on orders over $60. Standard international delivery: 7–14 business days.";
    el.appendChild(note);

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

      await apiFetch("/cart", { method: "DELETE" });

      // Success screen
      document.querySelector("main").innerHTML = `
        <div style="text-align:center;padding:5rem 2rem;max-width:560px;margin:0 auto">
          <div style="font-size:4rem;margin-bottom:1.5rem">🌿</div>
          <h2 style="font-family:'Playfair Display',serif;font-size:2rem;color:var(--brown);margin-bottom:1rem">
            Order Placed!
          </h2>
          <p style="color:var(--muted);line-height:1.8;margin-bottom:2rem">
            Thank you for your order #${order.id}.<br>
            Our artisans will carefully hand-pack your yarn in Marrakech.<br>
            Expect delivery within 7–14 business days.
          </p>
          <a href="/products.html" class="btn btn-primary">Continue Shopping</a>
        </div>
      `;
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Place Order";
    }
  });
});
