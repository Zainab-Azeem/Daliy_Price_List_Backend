const router = require("express").Router();
const { authenticate } = require("../middlewares/authenticate");
const {
  getFavourites,
  addFavourite,
  removeFavourite,
} = require("../controllers/favourite.controller");

router.get("/", authenticate, getFavourites);
router.post("/", authenticate, addFavourite);
router.delete("/:product_id", authenticate, removeFavourite);

module.exports = router;
