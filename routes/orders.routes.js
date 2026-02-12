const router = require("express").Router();
const { authenticate } = require("../middlewares/authenticate");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
} = require("../controllers/orders.controller");

router.post("/", authenticate, placeOrder);
router.get("/", authenticate, getMyOrders);
router.get("/:order_id", authenticate, getOrderById); // optional

module.exports = router;
