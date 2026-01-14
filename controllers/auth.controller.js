const bcrypt = require("bcryptjs");
const  pool  = require("../config/db");
const { transporter } = require("../config/nodemailer");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} = require("../utils/jwt");
const { setRefreshCookie } = require("../utils/cookies");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/* ========================= REGISTER ========================= */
exports.registerUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await pool.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const [roleRows] = await pool.query(
      "SELECT role_id FROM roles WHERE role_name = 'user' LIMIT 1"
    );

    if (!roleRows.length) {
      return res.status(500).json({ message: "Default role missing" });
    }

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
      html: `<p>Your OTP is <b>${otp}</b></p>`
    });

    return res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


/* ========================= LOGIN ========================= */

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.full_name, u.password_hash,
              u.avatar_url, u.last_login_at, u.is_verified, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Account not verified",
        needVerification: true,
        email: user.email
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    await pool.query(
      "UPDATE users SET last_login_at = NOW() WHERE user_id = ?",
      [user.user_id]
    );

    const accessToken = createAccessToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role_name
    });

    const refreshToken = createRefreshToken({ userId: user.user_id });
    setRefreshCookie(res, refreshToken, REFRESH_TOKEN_EXPIRY_MS);

    return res.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role_name
      },
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
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


//google
const client = new OAuth2Client();

const VALID_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
];

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken required" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: VALID_CLIENT_IDS,
    });

    const { sub, email, name, picture } = ticket.getPayload();

    const [rows] = await pool.query(
      `SELECT u.user_id, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.google_id = ? OR u.email = ?
       LIMIT 1`,
      [sub, email]
    );

    let userId, role = "user";

    if (rows.length === 0) {
      const [roleRows] = await pool.query(
        "SELECT role_id FROM roles WHERE role_name = 'user' LIMIT 1"
      );

      await pool.query(
        `INSERT INTO users (google_id, email, full_name, avatar_url, role_id, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [sub, email, name, picture, roleRows[0].role_id]
      );

      const [userRow] = await pool.query(
        "SELECT user_id FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      userId = userRow[0].user_id;
    } else {
      userId = rows[0].user_id;
      role = rows[0].role_name;
    }

    const accessToken = createAccessToken({ user_id: userId, email, role });
    const refreshToken = createRefreshToken({ userId });

    res.json({ message: "Google login successful", accessToken, refreshToken });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};


//facebook
exports.facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "accessToken required" });
    }

    // 1️⃣ Verify token with Facebook
    const appAccessToken =
      process.env.FACEBOOK_APP_ID + "|" + process.env.FACEBOOK_APP_SECRET;

    const debugRes = await axios.get(
      "https://graph.facebook.com/debug_token",
      {
        params: {
          input_token: accessToken,
          access_token: appAccessToken,
        },
      }
    );

    const debugData = debugRes.data?.data;

    if (!debugData || !debugData.is_valid) {
      return res.status(401).json({ message: "Invalid Facebook token" });
    }

    if (String(debugData.app_id) !== String(process.env.FACEBOOK_APP_ID)) {
      return res.status(401).json({ message: "Token not for this app" });
    }

    // 2️⃣ Get Facebook profile
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

    // 3️⃣ Check if user exists
    const [rows] = await pool.query(
      `SELECT u.user_id, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.facebook_id = ? OR u.email = ?
       LIMIT 1`,
      [id, email]
    );

    let userId;
    let role = "user";

    if (rows.length === 0) {
      // Create user
      const [roleRows] = await pool.query(
        "SELECT role_id FROM roles WHERE role_name = 'user' LIMIT 1"
      );

      await pool.query(
        `INSERT INTO users 
         (facebook_id, email, full_name, avatar_url, role_id, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, email || "", name || "", avatar, roleRows[0].role_id]
      );

      // 🔑 IMPORTANT: fetch UUID (NOT insertId)
      const [userRow] = await pool.query(
        "SELECT user_id FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      userId = userRow[0].user_id;
    } else {
      userId = rows[0].user_id;
      role = rows[0].role_name;
    }

    // 4️⃣ Issue tokens
    const accessTokenJwt = createAccessToken({
      user_id: userId,
      email,
      role,
    });

    const refreshToken = createRefreshToken({ userId });

    return res.json({
      message: "Facebook login successful",
      accessToken: accessTokenJwt,
      refreshToken,
    });

  } catch (err) {
    console.error(err?.response?.data || err.message);
    return res.status(401).json({ message: "Facebook login failed" });
  }
};
