const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { protect, restrictTo } = require("../middleware/auth");
const validate = require("../middleware/validate");

// In-memory orders (replace with Mongoose Order model in production)
let orders = [];

// ── POST /api/orders  (place order) ───────────────────────────────────────────
router.post(
  "/",
  protect,
  [
    body("items").isArray({ min: 1 }).withMessage("Order must have at least one item."),
    body("items.*.productId").trim().isAlphanumeric(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("items.*.price").isFloat({ min: 0 }),
    body("shippingAddress.street").trim().notEmpty().escape(),
    body("shippingAddress.city").trim().notEmpty().escape(),
    body("shippingAddress.country").trim().notEmpty().escape().isLength({ max: 100 }),
    body("shippingAddress.postalCode").trim().notEmpty().escape().isLength({ max: 20 }),
  ],
  validate,
  (req, res) => {
    const { items, shippingAddress } = req.body;

    // NOTE: In production, re-validate prices server-side from the DB
    // Never trust client-submitted prices for final billing.
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

    const order = {
      id: Date.now().toString(),
      userId: req.user.id,
      items,
      shippingAddress,
      total: parseFloat(total.toFixed(2)),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    orders.push(order);
    res.status(201).json(order);
  }
);

// ── GET /api/orders  (customer's own orders) ──────────────────────────────────
router.get("/", protect, (req, res) => {
  const userOrders = orders.filter((o) => o.userId === req.user.id);
  res.json(userOrders);
});

// ── GET /api/orders/all  (admin: all orders) ──────────────────────────────────
router.get("/all", protect, restrictTo("admin"), (req, res) => {
  res.json(orders);
});

// ── PATCH /api/orders/:id/status  (admin: update order status) ────────────────
router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  [body("status").isIn(["pending", "processing", "shipped", "delivered", "cancelled"])],
  validate,
  (req, res) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    order.status = req.body.status;
    res.json(order);
  }
);

module.exports = router;
