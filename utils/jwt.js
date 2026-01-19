const jwt = require("jsonwebtoken");

// Use env variables directly in JS
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets not configured");
}

// 🔐 Access Token (1 day)
exports.createAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

// 🔄 Refresh Token (7 days)
exports.createRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// 🔢 OTP Token (10 minutes)
exports.createOtpToken = (email, otp) => {
  return jwt.sign({ email, otp }, JWT_SECRET, { expiresIn: "10m" });
};

// ✅ Verify Access Token
exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// ✅ Verify Refresh Token
exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
