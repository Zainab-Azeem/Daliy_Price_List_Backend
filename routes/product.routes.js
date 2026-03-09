const router = require("express").Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,

} = require("../controllers/product.controller");
const upload = require("../middlewares/upload");



const {authenticate} = require("../middlewares/authenticate");
const {authorize} = require("../middlewares/authorize");

// Get all products (App uses this)
router.get("/", authenticate,authorize("admin","superadmin","user"),getAllProducts);

// Get single product
router.get("/:id",authenticate,authorize("admin","superadmin","user"),getProductById);



router.post("/", authenticate, authorize("admin","superadmin"),upload.single("image"), createProduct);
router.put("/:id", authenticate, authorize("admin","superadmin"), upload.single("image"), updateProduct);
router.delete("/:id", authenticate, authorize("admin","superadmin"), deleteProduct);


module.exports = router;
