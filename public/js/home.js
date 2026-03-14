/**
 * home.js – Fetch and render featured products on the homepage.
 */

function renderProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  // Color image area
  const imgArea = document.createElement("div");
  imgArea.className = "product-card-image";
  const bg = product.colors && product.colors.length
    ? `linear-gradient(135deg, ${product.colors.join(", ")})`
    : "var(--cream-dk)";
  imgArea.style.background = bg;
  const emoji = document.createElement("span");
  emoji.textContent = product.emoji || "🧶";
  emoji.style.filter = "drop-shadow(0 2px 6px rgba(0,0,0,.3))";
  imgArea.appendChild(emoji);
  card.appendChild(imgArea);

  const body = document.createElement("div");
  body.className = "product-card-body";

  const tag = document.createElement("span");
  tag.className = "product-tag";
  tag.textContent = (product.weight || product.category) + (product.fiber ? " · " + product.fiber.split(" ").slice(-2).join(" ") : "");

  const name = document.createElement("h3");
  name.textContent = product.name;

  const desc = document.createElement("p");
  desc.textContent = product.description;

  // Color dots
  if (product.colors && product.colors.length) {
    const dots = document.createElement("div");
    dots.className = "product-colors";
    product.colors.forEach((c) => {
      const dot = document.createElement("span");
      dot.className = "product-color-dot";
      dot.style.background = c;
      dots.appendChild(dot);
    });
    body.append(tag, name, desc, dots);
  } else {
    body.append(tag, name, desc);
  }

  const footer = document.createElement("div");
  footer.className = "product-card-footer";

  const price = document.createElement("div");
  price.className = "product-price";
  price.textContent = `$${parseFloat(product.price).toFixed(2)}`;

  const skeinInfo = document.createElement("div");
  skeinInfo.className = "product-stock";
  skeinInfo.textContent = product.skeinSize || `${product.stock} in stock`;

  const btn = document.createElement("a");
  btn.className = "btn btn-primary";
  btn.href = "/products.html";
  btn.textContent = "View";
  btn.style.padding = "0.45rem 1rem";
  btn.style.fontSize = "0.78rem";

  footer.append(price, skeinInfo, btn);
  body.appendChild(footer);
  card.appendChild(body);
  return card;
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  try {
    const { products } = await apiFetch("/products?limit=4");
    grid.innerHTML = "";
    if (!products.length) { grid.textContent = "No products yet."; return; }
    products.forEach((p) => grid.appendChild(renderProductCard(p)));
  } catch {
    grid.textContent = "Could not load products.";
  }
});
