const router = require("express").Router();
const { authenticate } = require("../middlewares/authenticate");
const {
  getCart,
  addToCart,
  updateCartItemQty,
  removeCartItem,
  clearCart,
} = require("../controllers/cart.controller");

router.get("/", authenticate, getCart);
router.post("/items", authenticate, addToCart);
router.patch("/items/:cart_item_id", authenticate, updateCartItemQty);
router.delete("/items/:cart_item_id", authenticate, removeCartItem);
router.delete("/clear", authenticate, clearCart); // optional

module.exports = router;
