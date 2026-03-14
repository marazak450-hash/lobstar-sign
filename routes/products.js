const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

// In-memory store (replace with Mongoose Product model in production)
let products = [
  {
    id: "1", name: "Saffron Gold – DK Weight", price: 28.00,
    category: "DK", stock: 40, emoji: "🟡",
    colors: ["#D4A017","#F0C040","#C4622D"],
    weight: "DK (8 ply)", fiber: "100% Organic Merino Wool", skeinSize: "100g / 220m",
    description: "Sun-kissed saffron gold harvested from Atlas fields. A warm, rich tone that shifts from deep amber to bright gold. Perfect for shawls, lightweight sweaters, and accessories.",
    dyeSource: "Crocus sativus (saffron) & pomegranate skin"
  },
  {
    id: "2", name: "Atlas Indigo – Fingering", price: 24.00,
    category: "Fingering", stock: 35, emoji: "🔵",
    colors: ["#1B3A6B","#2D5FA6","#4A4E69"],
    weight: "Fingering (4 ply)", fiber: "100% Organic Merino Wool", skeinSize: "100g / 400m",
    description: "Deep midnight indigo from wild-harvested woad plants. A timeless, meditative blue with subtle variations between skeins. Ideal for socks, delicate lace, and fine knits.",
    dyeSource: "Indigofera tinctoria & woad leaves"
  },
  {
    id: "3", name: "Terracotta Bloom – Aran", price: 32.00,
    category: "Aran", stock: 25, emoji: "🟠",
    colors: ["#C4622D","#9E4A1E","#E8A87C"],
    weight: "Aran (10 ply)", fiber: "100% Organic Lamb Wool", skeinSize: "100g / 180m",
    description: "The warm blush of Moroccan clay walls at sunset. Hand-dyed with madder root for a rich terracotta that mellows beautifully with washing. Great for cozy sweaters and winter wraps.",
    dyeSource: "Rubia tinctorum (madder root)"
  },
  {
    id: "4", name: "Henna Rose – DK Weight", price: 28.00,
    category: "DK", stock: 30, emoji: "🌸",
    colors: ["#8B2252","#B5446E","#D4789A"],
    weight: "DK (8 ply)", fiber: "100% Organic Merino Wool", skeinSize: "100g / 220m",
    description: "The ancient rose-red of henna celebrations. Harvested from lawsonia leaves used for centuries by Berber women. A deep, romantic pink with incredible depth and complexity.",
    dyeSource: "Lawsonia inermis (henna leaves)"
  },
  {
    id: "5", name: "Cedar Forest – Bulky", price: 38.00,
    category: "Bulky", stock: 20, emoji: "🌲",
    colors: ["#4A7C59","#2C5F4A","#7EB895"],
    weight: "Bulky (12 ply)", fiber: "100% Organic Churro Wool", skeinSize: "100g / 120m",
    description: "The living green of Atlas cedar forests. Dyed with cedar bark and nettles for a green that breathes. Luxuriously thick for fast, satisfying knitting on big needles.",
    dyeSource: "Cedrus atlantica bark & Urtica dioica (nettle)"
  },
  {
    id: "6", name: "Natural Undyed – Fingering", price: 20.00,
    category: "Fingering", stock: 60, emoji: "🤍",
    colors: ["#FAF7F0","#E8D5B0","#C8B89A"],
    weight: "Fingering (4 ply)", fiber: "100% Organic Merino Wool", skeinSize: "100g / 400m",
    description: "Pure, undyed, unbleached — the wool exactly as it came from the sheep. Three natural shades available: snow white, warm ivory, and oatmeal. A blank canvas for your own dye adventures.",
    dyeSource: "Undyed – natural fleece colour"
  },
  {
    id: "7", name: "Walnut Shadow – Aran", price: 32.00,
    category: "Aran", stock: 18, emoji: "🤎",
    colors: ["#6B3A2A","#8B4513","#3D2010"],
    weight: "Aran (10 ply)", fiber: "100% Organic Lamb Wool", skeinSize: "100g / 180m",
    description: "Rich chocolate-brown from walnut shells collected beneath ancient trees. A deep, moody earth tone with hints of amber and mahogany. Magnificent for textured cables and winter accessories.",
    dyeSource: "Juglans regia (walnut shells & leaves)"
  },
  {
    id: "8", name: "Desert Sunrise – DK Gradient", price: 36.00,
    category: "DK", stock: 15, emoji: "🌅",
    colors: ["#FAF7F0","#E8A87C","#C4622D","#D4A017"],
    weight: "DK (8 ply)", fiber: "100% Organic Merino Wool", skeinSize: "150g / 330m",
    description: "A rare hand-painted skein that transitions from natural ivory through desert sand to terracotta and gold — like watching the sun rise over the Sahara. Each skein is completely unique. Limited availability.",
    dyeSource: "Multi: saffron, madder, pomegranate – hand painted"
  },
];

// ── GET /api/products ─────────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("category").optional().trim().escape(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  (req, res) => {
    let result = [...products];
    const { category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    if (category) result = result.filter((p) => p.category === category);
    if (minPrice) result = result.filter((p) => p.price >= parseFloat(minPrice));
    if (maxPrice) result = result.filter((p) => p.price <= parseFloat(maxPrice));

    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + Number(limit));

    res.json({ total: result.length, page: Number(page), limit: Number(limit), products: paginated });
  }
);

// ── GET /api/products/:id ─────────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").isAlphanumeric()],
  validate,
  (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  }
);

// ── POST /api/products  (admin only) ──────────────────────────────────────────
router.post(
  "/",
  protect,
  restrictTo("admin"),
  [
    body("name").trim().notEmpty().escape(),
    body("price").isFloat({ min: 0 }),
    body("category").trim().notEmpty().escape(),
    body("stock").isInt({ min: 0 }),
    body("description").trim().escape(),
  ],
  validate,
  (req, res) => {
    const { name, price, category, stock, description } = req.body;
    const product = { id: Date.now().toString(), name, price, category, stock, description };
    products.push(product);
    res.status(201).json(product);
  }
);

// ── PATCH /api/products/:id  (admin only) ─────────────────────────────────────
router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  [
    param("id").isAlphanumeric(),
    body("price").optional().isFloat({ min: 0 }),
    body("stock").optional().isInt({ min: 0 }),
    body("name").optional().trim().escape(),
    body("description").optional().trim().escape(),
  ],
  validate,
  (req, res) => {
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Product not found." });

    products[idx] = { ...products[idx], ...req.body };
    res.json(products[idx]);
  }
);

// ── DELETE /api/products/:id  (admin only) ────────────────────────────────────
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  [param("id").isAlphanumeric()],
  validate,
  (req, res) => {
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Product not found." });
    products.splice(idx, 1);
    res.status(204).send();
  }
);

module.exports = router;
