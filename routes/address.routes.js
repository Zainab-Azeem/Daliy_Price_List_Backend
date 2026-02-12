const router = require("express").Router();
const { authenticate } = require("../middlewares/authenticate");
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");

router.get("/", authenticate, getAddresses);
router.post("/", authenticate, createAddress);
router.put("/:address_id", authenticate, updateAddress);
router.delete("/:address_id", authenticate, deleteAddress);
router.patch("/:address_id/default", authenticate, setDefaultAddress);

module.exports = router;
