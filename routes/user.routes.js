const router = require("express").Router();
const { query } = require("express-validator");
const validate = require("../middleware/validate.js");
const { authenticate, requireRole } = require("../middleware/auth.js");
const upload = require("../config/multer.js");
const U = require("../controllers/user.controller.js");

router.get("/", authenticate, /* optionally requireRole("admin"), */ [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().isString(),
], validate, U.list);

router.get("/me", authenticate, U.me);
router.put("/me", authenticate, upload.single("profileImage"), U.updateMe);

router.get("/:id", authenticate, U.getPublic);

module.exports = router;
