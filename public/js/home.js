/**
 * home.js – Fetch and render featured products on the homepage.
 */

function renderProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const cat = document.createElement("span");
  cat.className = "category";
  cat.textContent = product.category;

  const name = document.createElement("h3");
  name.textContent = product.name;

  const desc = document.createElement("p");
  desc.textContent = product.description;

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = `$${parseFloat(product.price).toFixed(2)}`;

  const btn = document.createElement("a");
  btn.className = "btn btn-primary";
  btn.href = "/products.html";
  btn.textContent = "View in Shop";

  card.append(cat, name, desc, price, btn);
  return card;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const { products } = await apiFetch("/products?limit=3");
    grid.innerHTML = "";
    if (!products.length) {
      grid.textContent = "No products available yet.";
      return;
    }
    products.forEach((p) => grid.appendChild(renderProductCard(p)));
  } catch (err) {
    grid.textContent = "Could not load products.";
  }
});
