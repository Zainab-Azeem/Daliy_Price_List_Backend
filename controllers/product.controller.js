const  pool  = require("../config/db");


/* ================= CREATE PRODUCT ================= */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, discount_percent, stock_qty, category_id } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    // multer gives uploaded file here
    // const image_url = req.file ? `/uploads/${req.file.filename}` : "";
    const BASE_URL = process.env.BASE_URL;

    const image_url = req.file
      ? `${BASE_URL}/uploads/${req.file.filename}`
      : null;

    await pool.query(
      `INSERT INTO products
      (name, description, price, discount_percent, stock_qty, image_url, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || "",
        price,
        discount_percent || 0,
        stock_qty || 0,
        image_url,
        category_id ? Number(category_id) : null
      ]
    );

    res.status(201).json({ message: "Product created successfully"});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL PRODUCTS ================= */
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       WHERE p.is_active = 1
       ORDER BY p.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PRODUCT BY ID ================= */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       WHERE p.product_id = ? AND p.is_active = 1
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= UPDATE PRODUCT ================= */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, discount_percent, stock_qty, category_id } = req.body;

    // Get existing product
    const [existing] = await pool.query(
      `SELECT * FROM products WHERE product_id = ? AND is_active = 1`,
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldProduct = existing[0];

    const BASE_URL = process.env.BASE_URL;
const image_url = req.file
  ? `${BASE_URL}/uploads/${req.file.filename}`
  : oldProduct.image_url; // keep old image if no new file uploaded

    // Insert NEW row instead of updating
    await pool.query(
      `INSERT INTO products
      (name, description, price, discount_percent, stock_qty, image_url, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name || oldProduct.name,
        description || oldProduct.description,
        price || oldProduct.price,
        discount_percent || oldProduct.discount_percent,
        stock_qty || oldProduct.stock_qty,
        image_url,
        category_id || oldProduct.category_id
      ]
    );

    res.json({ message: "New product version created successfully" });

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


/* ================= GET PRODUCTS BY date ================= */
exports.getProductsbydate = async (req, res) => {
  try {
    const { date } = req.query;

    const selectedDate = date || new Date().toISOString().split("T")[0];

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       WHERE p.is_active = 1
         AND DATE(p.created_at) = ?
       ORDER BY p.created_at DESC`,
      [selectedDate]
    );

    res.json(rows); // keep same format (no frontend change needed)
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
