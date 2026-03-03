const router = require("express").Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/product.controller");
const upload = require("../middlewares/upload");



const {authenticate} = require("../middlewares/authenticate");
const {authorize} = require("../middlewares/authorize");

// Get all products (App uses this)
router.get("/", authenticate,getAllProducts);

// Get single product
router.get("/:id",authenticate,getProductById);


// router.post("/", authenticate, createProduct);
router.post("/", authenticate, upload.single("image"), createProduct);
// router.put("/:id", authenticate, updateProduct);
router.put("/:id", authenticate, upload.single("image"), updateProduct);
router.delete("/:id", authenticate, deleteProduct);

module.exports = router;
