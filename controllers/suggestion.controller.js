const  pool  = require("../config/db");

exports.createSuggestion = async (req, res) => {
  try {
    const { name, description, price, discount_percent, stock_qty, category_id } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    const BASE_URL = process.env.BASE_URL;
    const image_url = req.file ? `${BASE_URL}/uploads/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO suggestion
      (name, description, price, discount_percent, stock_qty, image_url, category_id, approval_status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1)`,
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

    res.status(201).json({ message: "Suggestion submitted for approval" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getAllsuggestion = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, c.name AS category_name
       FROM suggestion s
       LEFT JOIN categories c ON c.category_id = s.category_id
       WHERE s.is_active = 1
       ORDER BY s.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveSuggestion = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    
    await connection.beginTransaction();
    
    const [rows] = await connection.query(
        `SELECT * FROM suggestion WHERE product_id = ? AND is_active = 1`,
        [id]
    );
    
    if (!rows.length) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "Suggestion not found" });
    }
    
    const suggestion = rows[0];
    
    if (suggestion.approval_status !== "pending") {
    await connection.rollback();
    connection.release();
    return res.status(400).json({ message: "Only pending suggestions can be approved" });
  }
    // insert into products
    await connection.query(
      `INSERT INTO products
      (name, description, price, discount_percent, stock_qty, image_url, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        suggestion.name,
        suggestion.description,
        suggestion.price,
        suggestion.discount_percent,
        suggestion.stock_qty,
        suggestion.image_url,
        suggestion.category_id
      ]
    );

    // update suggestion status
    await connection.query(
      `UPDATE suggestion
       SET approval_status = 'approved'
       WHERE product_id = ?`,
      [id]
    );

    await connection.commit();
    connection.release();

    res.json({ message: "Suggestion approved and product added" });

  } catch (err) {
    console.error(err);

    try {
      await connection.rollback();
    } catch {}

    connection.release();

    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectSuggestion = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE suggestion SET approval_status = 'rejected'
       WHERE product_id = ?`,
      [id]
    );

    res.json({ message: "Suggestion rejected" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};