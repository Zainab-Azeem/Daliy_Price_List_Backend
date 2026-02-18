const pool = require("../config/db");

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE is_active=1 ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM products
       WHERE is_active=1 AND category=?
       ORDER BY created_at DESC`,
      [category]
    );

    res.json(rows);
  } catch (err) {
    console.error("getProductsByCategory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
