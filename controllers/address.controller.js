const pool = require("../config/db");

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await pool.query(
      `SELECT * FROM addresses
       WHERE user_id=?
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("getAddresses error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      full_name,
      phone,
      province,
      district,
      zone,
      city,
      area,
      street,
      postal_code,
      is_default,
    } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ message: "full_name and phone required" });
    }

    // If this address should be default -> make all others not default
    if (is_default === 1 || is_default === true) {
      await pool.query("UPDATE addresses SET is_default=0 WHERE user_id=?", [userId]);
    }

    const [result] = await pool.query(
      `INSERT INTO addresses
       (user_id, full_name, phone, province, district, zone, city, area, street, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        full_name,
        phone,
        province || null,
        district || null,
        zone || null,
        city || null,
        area || null,
        street || null,
        postal_code || null,
        (is_default === 1 || is_default === true) ? 1 : 0,
      ]
    );

    res.status(201).json({ message: "Address created", address_id: result.insertId });
  } catch (err) {
    console.error("createAddress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { address_id } = req.params;

    const {
      full_name,
      phone,
      province,
      district,
      zone,
      city,
      area,
      street,
      postal_code,
    } = req.body;

    // Ensure address belongs to user
    const [exists] = await pool.query(
      "SELECT address_id FROM addresses WHERE address_id=? AND user_id=? LIMIT 1",
      [address_id, userId]
    );
    if (!exists.length) return res.status(404).json({ message: "Address not found" });

    await pool.query(
      `UPDATE addresses SET
        full_name=?,
        phone=?,
        province=?,
        district=?,
        zone=?,
        city=?,
        area=?,
        street=?,
        postal_code=?
       WHERE address_id=? AND user_id=?`,
      [
        full_name || exists[0].full_name,
        phone || exists[0].phone,
        province || null,
        district || null,
        zone || null,
        city || null,
        area || null,
        street || null,
        postal_code || null,
        address_id,
        userId,
      ]
    );

    res.json({ message: "Address updated" });
  } catch (err) {
    console.error("updateAddress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { address_id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM addresses WHERE address_id=? AND user_id=?",
      [address_id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Address not found" });

    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error("deleteAddress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { address_id } = req.params;

    const [exists] = await pool.query(
      "SELECT address_id FROM addresses WHERE address_id=? AND user_id=? LIMIT 1",
      [address_id, userId]
    );
    if (!exists.length) return res.status(404).json({ message: "Address not found" });

    await pool.query("UPDATE addresses SET is_default=0 WHERE user_id=?", [userId]);
    await pool.query(
      "UPDATE addresses SET is_default=1 WHERE address_id=? AND user_id=?",
      [address_id, userId]
    );

    res.json({ message: "Default address set" });
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
