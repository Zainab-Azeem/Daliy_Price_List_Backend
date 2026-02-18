const router = require("express").Router();
const { authenticate } = require("../middlewares/authenticate");
const { getCategories, getProductsByCategory } = require("../controllers/category.controller");

router.get("/", authenticate, getCategories);
router.get("/:category", authenticate, getProductsByCategory); 


module.exports = router;
