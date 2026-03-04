const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.createUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "full_name, email, password required" });
    }

    
    const [exists] = await pool.query(
      `SELECT user_id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (exists.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    
    const [roleRows] = await pool.query(
      `SELECT role_id FROM roles WHERE role_name = 'user' LIMIT 1`
    );
    if (!roleRows.length) {
      return res.status(500).json({ message: "Role not found " });
    }

    //  hash password and insert
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id, is_verified)
       VALUES (?, ?, ?, ?, 1)`,
      [full_name, email, password_hash, roleRows[0].role_id || null]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.avatar_url,
        u.is_verified,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        u.role_id,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.avatar_url,
        u.is_verified,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        u.role_id,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ? AND u.is_active = 1
      LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, avatar_url, password, is_verified } = req.body;

    // Check if user exists and is active
    const [existing] = await pool.query(
      `SELECT user_id, email FROM users WHERE user_id = ? AND is_active = 1 LIMIT 1`,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is already used by another user
    if (email && email !== existing[0].email) {
      const [emailExists] = await pool.query(
        `SELECT user_id FROM users WHERE email = ? LIMIT 1`,
        [email]
      );

      if (emailExists.length) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Dynamic fields for update
    const fields = [];
    const values = [];

    if (full_name !== undefined) {
      fields.push("full_name = ?");
      values.push(full_name);
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (avatar_url !== undefined) {
      fields.push("avatar_url = ?");
      values.push(avatar_url);
    }

    if (is_verified !== undefined) {
      fields.push("is_verified = ?");
      values.push(is_verified ? 1 : 0);
    }

    // Hash password if provided
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      fields.push("password_hash = ?");
      values.push(password_hash);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = ? AND is_active = 1`,
      values
    );

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE users SET is_active = 0 WHERE user_id = ? AND is_active = 1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;      // user_id
    const { role_name } = req.body; // admin / superadmin / user

    if (!role_name) {
      return res.status(400).json({ message: "role_name is required" });
    }

    // Check if user exists
    const [user] = await pool.query(
      `SELECT user_id FROM users WHERE user_id = ? AND is_active = 1`,
      [id]
    );

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get role_id from roles table
    const [role] = await pool.query(
      `SELECT role_id FROM roles WHERE role_name = ? LIMIT 1`,
      [role_name]
    );

    if (!role.length) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Update role_id
    await pool.query(
      `UPDATE users SET role_id = ? WHERE user_id = ?`,
      [role[0].role_id, id]
    );

    res.json({ message: "User role updated successfully" });

  } catch (err) {
    console.error("updateUserRole error:", err);
    res.status(500).json({ message: "Server error" });
  }
};