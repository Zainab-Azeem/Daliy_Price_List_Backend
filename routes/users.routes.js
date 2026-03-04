const router = require("express").Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/users.controller");


const {authenticate} = require("../middlewares/authenticate");
const {authorize} = require("../middlewares/authorize");



router.post("/", authenticate,createUser);
router.get("/",authenticate, getAllUsers);
router.get("/:id", authenticate, getUserById);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

module.exports = router;