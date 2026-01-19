const  pool  = require("../config/db");


/* ================= CREATE PRODUCT ================= */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount_percent,
      stock_qty,
      image_url,
      category
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    await pool.query(
      `INSERT INTO products
      (name, description, price, discount_percent, stock_qty, image_url, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || "",
        price,
        discount_percent || 0,
        stock_qty || 0,
        image_url || "",
        category || ""
      ]
    );

    res.status(201).json({ message: "Product created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL PRODUCTS ================= */
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PRODUCT BY ID ================= */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_id = ? AND is_active = 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE PRODUCT ================= */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      discount_percent,
      stock_qty,
      image_url,
      category
    } = req.body;

    const [result] = await pool.query(
      `UPDATE products SET
        name = ?,
        description = ?,
        price = ?,
        discount_percent = ?,
        stock_qty = ?,
        image_url = ?,
        category = ?
      WHERE product_id = ?`,
      [
        name,
        description,
        price,
        discount_percent,
        stock_qty,
        image_url,
        category,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE PRODUCT (SOFT) ================= */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE products SET is_active = 0 WHERE product_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
