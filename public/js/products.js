/**
 * products.js – Product listing page.
 */

function buildProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  const imgArea = document.createElement("div");
  imgArea.className = "product-card-image";
  const bg = product.colors && product.colors.length
    ? `linear-gradient(135deg, ${product.colors.join(", ")})`
    : "var(--cream-dk)";
  imgArea.style.background = bg;
  const emoji = document.createElement("span");
  emoji.textContent = product.emoji || "🧶";
  emoji.style.filter = "drop-shadow(0 2px 8px rgba(0,0,0,.35))";
  imgArea.appendChild(emoji);
  card.appendChild(imgArea);

  const body = document.createElement("div");
  body.className = "product-card-body";

  const tag = document.createElement("span");
  tag.className = "product-tag";
  tag.textContent = product.weight || product.category;

  const name = document.createElement("h3");
  name.textContent = product.name;

  const desc = document.createElement("p");
  desc.textContent = product.description;

  const meta = document.createElement("small");
  meta.style.color = "var(--muted)";
  meta.style.fontSize = "0.78rem";
  meta.textContent = [product.fiber, product.skeinSize].filter(Boolean).join(" · ");

  if (product.dyeSource) {
    const dye = document.createElement("small");
    dye.style.cssText = "color:var(--terracotta);font-size:.75rem;font-style:italic;";
    dye.textContent = "Dye: " + product.dyeSource;
    body.append(tag, name, desc, meta, dye);
  } else {
    body.append(tag, name, desc, meta);
  }

  if (product.colors && product.colors.length) {
    const dots = document.createElement("div");
    dots.className = "product-colors";
    product.colors.forEach((c) => {
      const dot = document.createElement("span");
      dot.className = "product-color-dot";
      dot.style.background = c;
      dots.appendChild(dot);
    });
    body.appendChild(dots);
  }

  const footer = document.createElement("div");
  footer.className = "product-card-footer";

  const price = document.createElement("div");
  price.className = "product-price";
  price.textContent = `$${parseFloat(product.price).toFixed(2)}`;

  const stockEl = document.createElement("span");
  stockEl.className = "product-stock";
  stockEl.textContent = product.stock > 5
    ? `${product.stock} left`
    : product.stock > 0
      ? `Only ${product.stock} left!`
      : "Sold out";
  if (product.stock <= 5 && product.stock > 0) stockEl.style.color = "var(--terracotta)";

  const btn = document.createElement("button");
  btn.className = "btn btn-primary btn-sm";
  btn.textContent = product.stock === 0 ? "Sold Out" : "Add to Cart";
  btn.disabled = product.stock === 0;
  btn.addEventListener("click", () => addToCart(product, btn));

  footer.append(price, stockEl, btn);
  body.appendChild(footer);
  card.appendChild(body);
  return card;
}

async function addToCart(product, btn) {
  if (!getToken()) { window.location.href = "/login.html"; return; }
  btn.disabled = true;
  btn.textContent = "Adding…";
  try {
    await apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify({ productId: product.id, quantity: 1, price: product.price, name: product.name }),
    });
    btn.textContent = "Added! ✓";
    btn.style.background = "var(--indigo)";
    updateCartCount();
    setTimeout(() => {
      btn.textContent = "Add to Cart";
      btn.style.background = "";
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    btn.textContent = "Error";
    btn.disabled = false;
    alert(err.message);
  }
}

async function loadProducts(params = {}) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "<p class='loading'>Loading collection…</p>";

  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
  ).toString();

  try {
    const { products, total } = await apiFetch(`/products${qs ? "?" + qs : ""}`);
    grid.innerHTML = "";
    const countEl = document.getElementById("product-count");
    if (countEl) countEl.textContent = `${total} skein${total !== 1 ? "s" : ""} found`;
    if (!products.length) {
      grid.innerHTML = "<div class='empty-state'><div class='empty-icon'>🧶</div><p>No yarns match your filter. Try a different search.</p></div>";
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
      category: document.getElementById("filter-category").value,
      minPrice: document.getElementById("filter-min").value,
      maxPrice: document.getElementById("filter-max").value,
    });
  });
});
