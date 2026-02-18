const pool = require("../config/db");

exports.getFavourites = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await pool.query(
      `SELECT 
         p.product_id, p.name, p.price, p.image_url
       FROM favourites f
       JOIN products p ON p.product_id = f.product_id
       WHERE f.user_id=?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("getFavourites error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addFavourite = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.body;

    if (!product_id) return res.status(400).json({ message: "product_id required" });

    // INSERT IGNORE works only if you added UNIQUE(user_id, product_id)
    await pool.query(
      `INSERT IGNORE INTO favourites (user_id, product_id) VALUES (?, ?)`,
      [userId, product_id]
    );

    res.status(201).json({ message: "Added to favourites" });
  } catch (err) {
    console.error("addFavourite error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeFavourite = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.params;

    await pool.query(
      `DELETE FROM favourites WHERE user_id=? AND product_id=?`,
      [userId, product_id]
    );

    res.json({ message: "Removed from favourites" });
  } catch (err) {
    console.error("removeFavourite error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
