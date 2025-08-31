const router = require("express").Router();
const { body, query } = require("express-validator");
const validate = require("../middleware/validate.js");
const upload = require("../config/multer.js");
const C = require("../controllers/auth.controller.js");

router.post(
  "/register",
  upload.single("profileImage"),
  [ body("email").isEmail(), body("password").isLength({ min: 6 }) ],
  validate,
  C.register
);

router.get("/verify-email", [ query("token").exists() ], validate, C.verifyEmail);

router.post("/login", [ body("email").isEmail(), body("password").exists() ], validate, C.login);

router.post("/refresh", [ body("refreshToken").exists() ], validate, C.refresh);

router.post("/forgot-password", [ body("email").isEmail() ], validate, C.forgotPassword);

router.post("/reset-password", [ body("token").exists(), body("password").isLength({ min: 6 }) ], validate, C.resetPassword);

router.post("/logout", [ body("userId").isInt() ], validate, C.logout);

module.exports = router;
