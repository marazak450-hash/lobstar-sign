const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

// In-memory cart store keyed by user id (replace with DB in production)
const carts = new Map(); // { userId -> [{ productId, quantity, price, name }] }

const getCart = (userId) => carts.get(userId) || [];

// ── GET /api/cart ─────────────────────────────────────────────────────────────
router.get("/", protect, (req, res) => {
  const items = getCart(req.user.id);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ items, total: parseFloat(total.toFixed(2)) });
});

// ── POST /api/cart  (add item) ────────────────────────────────────────────────
router.post(
  "/",
  protect,
  [
    body("productId").trim().notEmpty().isAlphanumeric(),
    body("quantity").isInt({ min: 1, max: 100 }),
    body("price").isFloat({ min: 0 }),       // validated server-side against product DB in prod
    body("name").trim().notEmpty().escape(),
  ],
  validate,
  (req, res) => {
    const { productId, quantity, price, name } = req.body;
    const items = getCart(req.user.id);

    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 100);
    } else {
      items.push({ productId, quantity, price, name });
    }

    carts.set(req.user.id, items);
    res.json({ items, total: parseFloat(items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)) });
  }
);

// ── PATCH /api/cart/:productId  (update quantity) ─────────────────────────────
router.patch(
  "/:productId",
  protect,
  [
    param("productId").isAlphanumeric(),
    body("quantity").isInt({ min: 0, max: 100 }),
  ],
  validate,
  (req, res) => {
    let items = getCart(req.user.id);
    const { quantity } = req.body;

    if (quantity === 0) {
      items = items.filter((i) => i.productId !== req.params.productId);
    } else {
      const item = items.find((i) => i.productId === req.params.productId);
      if (!item) return res.status(404).json({ error: "Item not in cart." });
      item.quantity = quantity;
    }

    carts.set(req.user.id, items);
    res.json({ items, total: parseFloat(items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)) });
  }
);

// ── DELETE /api/cart  (clear cart) ────────────────────────────────────────────
router.delete("/", protect, (req, res) => {
  carts.delete(req.user.id);
  res.json({ items: [], total: 0 });
});

module.exports = router;
