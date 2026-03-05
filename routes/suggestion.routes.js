const router = require("express").Router();
const {
  createSuggestion,
  approveSuggestion,
  rejectSuggestion,
  getAllsuggestion

} = require("../controllers/suggestion.controller");
const upload = require("../middlewares/upload");



const {authenticate} = require("../middlewares/authenticate");
const {authorize} = require("../middlewares/authorize");

router.get("/", authenticate, getAllsuggestion);
router.post("/", authenticate, upload.single("image"), createSuggestion);
router.put("/:id/approve", approveSuggestion);
router.put("/:id/reject", rejectSuggestion);

module.exports = router;
