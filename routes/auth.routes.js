const router = require("express").Router();
const c = require("../controllers/forgotPassword.controller");
const {
  registerUser,
  loginUser,
  verifyOtp,
  googleLogin,
  facebookLogin,
  refreshAccessToken,
  logoutUser,
  resendOtp,
} = require("../controllers/auth.controller");

// Register + send OTP
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Verify OTP (after register)
router.post("/verify-otp", verifyOtp);
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.post("/refresh",refreshAccessToken);
router.post("/logout", logoutUser);
router.post("/resend-otp",resendOtp);


router.post("/forgot-password", c.forgotPassword);
router.post("/verify-forgot-otp", c.verifyForgotOtp);
router.post("/reset-password", c.resetPassword);


module.exports = router;









