/**
 * products.js – Product listing page with filtering and add-to-cart.
 */

function buildProductCard(product) {
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

  const stock = document.createElement("small");
  stock.style.color = "var(--muted)";
  stock.textContent = product.stock > 0 ? `${product.stock} in stock` : "Out of stock";

  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = "Add to Cart";
  btn.disabled = product.stock === 0;
  btn.addEventListener("click", () => addToCart(product, btn));

  card.append(cat, name, desc, price, stock, btn);
  return card;
}

async function addToCart(product, btn) {
  if (!getToken()) {
    window.location.href = "/login.html";
    return;
  }
  btn.disabled = true;
  btn.textContent = "Adding…";
  try {
    await apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
      }),
    });
    btn.textContent = "Added!";
    updateCartCount();
    setTimeout(() => {
      btn.textContent = "Add to Cart";
      btn.disabled = false;
    }, 1500);
  } catch (err) {
    btn.textContent = "Error";
    btn.disabled = false;
    alert(err.message);
  }
}

async function loadProducts(params = {}) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "<p class='loading'>Loading…</p>";

  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
  ).toString();

  try {
    const { products } = await apiFetch(`/products${qs ? "?" + qs : ""}`);
    grid.innerHTML = "";
    if (!products.length) {
      grid.textContent = "No products found.";
      return;
    }
    products.forEach((p) => grid.appendChild(buildProductCard(p)));
  } catch {
    grid.textContent = "Could not load products.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  document.getElementById("filter-btn")?.addEventListener("click", () => {
    loadProducts({
      category: document.getElementById("filter-category").value.trim(),
      minPrice: document.getElementById("filter-min").value,
      maxPrice: document.getElementById("filter-max").value,
    });
  });
});
