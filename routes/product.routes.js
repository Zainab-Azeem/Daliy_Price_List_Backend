// const { authenticate } = require("../middlewares/authenticate");
// const { authorize } = require("../middlewares/authorize");

const router = require("express").Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/product.controller");



// Get all products (App uses this)
router.get("/", getAllProducts);

// Get single product
router.get("/:id", getProductById);

// 🔓 Admin CRUD (middleware removed TEMPORARILY)
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
