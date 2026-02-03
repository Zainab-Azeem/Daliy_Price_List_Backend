const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const {transporter} = require("../config/nodemailer");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { setRefreshCookie } = require("../utils/cookies");
const { clearRefreshCookie } = require("../utils/cookies");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");


const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/* ========================= REGISTER ========================= */
exports.registerUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
      
      return res.status(400).json({ message: "All fields required" });
    }

    const [exists] = await pool.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    if (exists.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const [roleRows] = await pool.query(
      "SELECT role_id FROM roles WHERE role_name='user' LIMIT 1"
    );

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id, is_verified)
       VALUES (?, ?, ?, ?, 0)`,
      [full_name, email, password_hash, roleRows[0].role_id]
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO otps (email, otp, purpose, expires_at)
       VALUES (?, ?, 'register', NOW() + INTERVAL 10 MINUTE)`,
      [email, otp]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP is <b>${otp}</b></p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========================= LOGIN ========================= */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.full_name, u.password_hash,
              u.avatar_url, u.is_verified, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    if (!user.is_verified)
      return res.status(403).json({ message: "Account not verified" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role_name,
    });

    const refreshToken = createRefreshToken({ userId: user.user_id });
    setRefreshCookie(res, refreshToken, REFRESH_TOKEN_EXPIRY_MS);

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========================= VERIFY OTP ========================= */

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const [rows] = await pool.query(
      `SELECT * FROM otps
       WHERE email = ? AND purpose = 'register'
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (!rows.length) return res.status(400).json({ message: "OTP not found" });

    const record = rows[0];
    const now = new Date();

    if (record.block_until && new Date(record.block_until) > now) {
      return res.status(429).json({ message: "Too many attempts" });
    }

    if (new Date(record.expires_at) < now)
      return res.status(400).json({ message: "OTP expired" });

    if (record.otp !== otp.toString()) {
      const attempts = record.attempts + 1;

      if (attempts >= 5) {
        await pool.query(
          `UPDATE otps
           SET attempts = ?, block_until = NOW() + INTERVAL 10 MINUTE
           WHERE otp_id = ?`,
          [attempts, record.otp_id]
        );
        return res.status(429).json({ message: "Blocked for 10 minutes" });
      }

      await pool.query(
        "UPDATE otps SET attempts = attempts + 1 WHERE otp_id = ?",
        [record.otp_id]
      );

      return res.status(400).json({ message: "Invalid OTP" });
    }

    await pool.query(
      "UPDATE users SET is_verified = 1 WHERE email = ?",
      [email]
    );

    await pool.query(
      "DELETE FROM otps WHERE email = ? AND purpose = 'register'",
      [email]
    );

    return res.json({ message: "Account verified successfully" });

  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ========================= RESEND OTP ========================= */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // Check user exists + not verified
    const [userRows] = await pool.query(
      "SELECT is_verified FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userRows[0].is_verified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Get latest OTP record for register
    const [otpRows] = await pool.query(
      `SELECT * FROM otps
       WHERE email = ? AND purpose = 'register'
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    const now = new Date();

    // If blocked (too many wrong attempts)
    if (otpRows.length && otpRows[0].block_until && new Date(otpRows[0].block_until) > now) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    // Cooldown: prevent spam resend within 60 seconds
    if (otpRows.length && otpRows[0].created_at) {
      const lastCreated = new Date(otpRows[0].created_at);
      const diffSeconds = Math.floor((now - lastCreated) / 1000);

      if (diffSeconds < 60) {
        return res.status(429).json({
          message: `Please wait ${60 - diffSeconds}s before resending`,
        });
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (otpRows.length) {
      // Update existing latest OTP row
      await pool.query(
        `UPDATE otps
         SET otp = ?, attempts = 0, block_until = NULL,
             expires_at = NOW() + INTERVAL 10 MINUTE
         WHERE otp_id = ?`,
        [otp, otpRows[0].otp_id]
      );
    } else {
      // Create OTP row if not exists
      await pool.query(
        `INSERT INTO otps (email, otp, purpose, expires_at)
         VALUES (?, ?, 'register', NOW() + INTERVAL 10 MINUTE)`,
        [email, otp]
      );
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code (Resent)",
      html: `<p>Your new OTP is <b>${otp}</b></p><p>This OTP expires in 10 minutes.</p>`,
    });

    return res.json({ message: "OTP resent to email" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ========================= GOOGLE LOGIN ========================= */
const client = new OAuth2Client();
const VALID_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
];

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return res.status(400).json({ message: "idToken required" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: VALID_CLIENT_IDS,
    });

    const { sub, email, name, picture } = ticket.getPayload();

    const [rows] = await pool.query(
      `SELECT u.user_id, r.role_name
       FROM users u JOIN roles r ON u.role_id=r.role_id
       WHERE u.google_id=? OR u.email=? LIMIT 1`,
      [sub, email]
    );

    let userId;
    let role = "user";

    if (!rows.length) {
      const [roleRows] = await pool.query(
        "SELECT role_id FROM roles WHERE role_name='user' LIMIT 1"
      );

      await pool.query(
        `INSERT INTO users (google_id, email, full_name, avatar_url, role_id, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [sub, email, name, picture, roleRows[0].role_id]
      );

      const [u] = await pool.query(
        "SELECT user_id FROM users WHERE email=? LIMIT 1",
        [email]
      );
      userId = u[0].user_id;
    } else {
      userId = rows[0].user_id;
      role = rows[0].role_name;
    }

    const accessToken = createAccessToken({ user_id: userId, email, role });
    const refreshToken = createRefreshToken({ userId });
    setRefreshCookie(res, refreshToken, REFRESH_TOKEN_EXPIRY_MS);

    res.json({ message: "Google login successful", accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

/* ========================= FACEBOOK LOGIN ========================= */
exports.facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken)
      return res.status(400).json({ message: "accessToken required" });

    const appToken =
      process.env.FACEBOOK_APP_ID + "|" + process.env.FACEBOOK_APP_SECRET;

    const debugRes = await axios.get(
      "https://graph.facebook.com/debug_token",
      {
        params: { input_token: accessToken, access_token: appToken },
      }
    );

    if (!debugRes.data?.data?.is_valid)
      return res.status(401).json({ message: "Invalid Facebook token" });

    const profileRes = await axios.get(
      "https://graph.facebook.com/me",
      {
        params: {
          fields: "id,name,email,picture.type(large)",
          access_token: accessToken,
        },
      }
    );

    const { id, name, email, picture } = profileRes.data;
    const avatar = picture?.data?.url || "";

    const [rows] = await pool.query(
      `SELECT u.user_id, r.role_name
       FROM users u JOIN roles r ON u.role_id=r.role_id
       WHERE u.facebook_id=? OR u.email=? LIMIT 1`,
      [id, email]
    );

    let userId;
    let role = "user";

    if (!rows.length) {
      const [roleRows] = await pool.query(
        "SELECT role_id FROM roles WHERE role_name='user' LIMIT 1"
      );

      await pool.query(
        `INSERT INTO users (facebook_id, email, full_name, avatar_url, role_id, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, email, name, avatar, roleRows[0].role_id]
      );

      const [u] = await pool.query(
        "SELECT user_id FROM users WHERE email=? LIMIT 1",
        [email]
      );
      userId = u[0].user_id;
    } else {
      userId = rows[0].user_id;
      role = rows[0].role_name;
    }

    const jwtAccess = createAccessToken({ user_id: userId, email, role });
    const refreshToken = createRefreshToken({ userId });
    setRefreshCookie(res, refreshToken, REFRESH_TOKEN_EXPIRY_MS);

    res.json({ message: "Facebook login successful", accessToken: jwtAccess });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Facebook login failed" });
  }
};

/* ========================= REFRESH TOKEN ========================= */
exports.refreshAccessToken = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies?.refreshToken;
    if (!refreshTokenFromCookie) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const payload = verifyRefreshToken(refreshTokenFromCookie);

    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [payload.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];

    const newAccessToken = createAccessToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role_name,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};


/* ========================= LOGOUT ========================= */
exports.logoutUser = async (req, res) => {
  try {
    clearRefreshCookie(res);
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};