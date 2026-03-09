const router = require("express").Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole
} = require("../controllers/users.controller");


const {authenticate} = require("../middlewares/authenticate");
const {authorize} = require("../middlewares/authorize");



router.post("/", authenticate, authorize("superadmin"),createUser);
router.get("/",authenticate, authorize("superadmin"), getAllUsers);
router.get("/:id", authenticate, authorize("superadmin"),getUserById);
router.put("/:id", authenticate, authorize("superadmin"), updateUser);
router.delete("/:id", authenticate, authorize("superadmin"), deleteUser);
router.put("/:id/role", authenticate, authorize("superadmin"), updateUserRole);
module.exports = router;