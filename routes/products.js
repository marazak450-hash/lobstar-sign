const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

// In-memory store (replace with Mongoose Product model in production)
let products = [
  { id: "1", name: "Wireless Headphones", price: 79.99, category: "Electronics", stock: 50, description: "Premium sound quality." },
  { id: "2", name: "Running Shoes", price: 119.99, category: "Footwear", stock: 30, description: "Lightweight and durable." },
  { id: "3", name: "Coffee Maker", price: 49.99, category: "Kitchen", stock: 20, description: "Brews a perfect cup every time." },
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
