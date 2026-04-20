const  pool  = require("../config/db");


/* ================= CREATE PRODUCT ================= */
const { v4: uuidv4 } = require("uuid");

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, discount_percent, stock_qty, category_id } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    const productId = uuidv4(); // ✅ generate UUID

    const BASE_URL = process.env.BASE_URL;
    const image_url = req.file
      ? `${BASE_URL}/uploads/${req.file.filename}`
      : null;

    // 1️⃣ insert into products
    await pool.query(
      `INSERT INTO products
       (product_id, name, description, image_url, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        productId,
        name,
        description || "",
        image_url,
        category_id || null
      ]
    );

    // 2️⃣ insert into product_updates
    await pool.query(
      `INSERT INTO product_updates
       (product_id, price, discount_percent, stock_qty)
       VALUES (?, ?, ?, ?)`,
      [
        productId,
        price,
        discount_percent || 0,
        stock_qty || 0
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      product_id: productId
    });

  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* ================= GET ALL PRODUCTS ================= */
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.product_id,
        p.name,
        p.description,
        p.image_url,
        p.category_id,
        p.is_active,
        p.created_at,
        p.updated_at,
        c.name AS category_name,
        pu.price,
        pu.discount_percent,
        pu.stock_qty,
        pu.created_at AS update_created_at
      FROM products p
      LEFT JOIN categories c ON c.category_id = p.category_id
      LEFT JOIN product_updates pu
        ON pu.update_id = (
          SELECT pu2.update_id
          FROM product_updates pu2
          WHERE pu2.product_id = p.product_id
          ORDER BY pu2.created_at DESC
          LIMIT 1
        )
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `);

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
    const { name, description, category_id } = req.body;

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
      : oldProduct.image_url;

    await pool.query(
      `UPDATE products
       SET name = ?, description = ?, image_url = ?, category_id = ?, updated_at = NOW()
       WHERE product_id = ?`,
      [
        name || oldProduct.name,
        description || oldProduct.description,
        image_url,
        category_id || oldProduct.category_id,
        id
      ]
    );

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProductPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, discount_percent, stock_qty } = req.body;

    if (!price) {
      return res.status(400).json({ message: "Price is required" });
    }

    await pool.query(
      `INSERT INTO product_updates
       (product_id, price, discount_percent, stock_qty)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        price,
        discount_percent || 0,
        stock_qty || 0
      ]
    );

    res.json({ message: "Product price updated successfully" });
  } catch (err) {
    console.error("updateProductPrice error:", err);
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

    const [rows] = await pool.query(`
      SELECT 
        p.product_id,
        p.name,
        p.description,
        p.image_url,
        p.category_id,
        p.is_active,
        c.name AS category_name,
        pu.price,
        pu.discount_percent,
        pu.stock_qty,
        pu.created_at AS update_created_at
      FROM products p
      LEFT JOIN categories c ON c.category_id = p.category_id
      INNER JOIN product_updates pu ON pu.product_id = p.product_id
      WHERE p.is_active = 1
        AND DATE(pu.created_at) = ?
      ORDER BY pu.created_at DESC
    `, [selectedDate]);

    res.json(rows);
  } catch (err) {
    console.error("getProductsbydate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};