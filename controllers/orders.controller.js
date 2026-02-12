const pool = require("../config/db");

exports.placeOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const { address_id } = req.body;

    if (!address_id) return res.status(400).json({ message: "address_id required" });

    // check address belongs to user
    const [addr] = await conn.query(
      "SELECT address_id FROM addresses WHERE address_id=? AND user_id=? LIMIT 1",
      [address_id, userId]
    );
    if (!addr.length) return res.status(404).json({ message: "Address not found" });

    // get active cart
    const [cartRows] = await conn.query(
      "SELECT cart_id FROM carts WHERE user_id=? AND status='active' LIMIT 1",
      [userId]
    );
    if (!cartRows.length) return res.status(400).json({ message: "Cart is empty" });

    const cartId = cartRows[0].cart_id;

    // get cart items with product price
    const [items] = await conn.query(
      `SELECT ci.product_id, ci.qty, p.price
       FROM cart_items ci
       JOIN products p ON p.product_id = ci.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (!items.length) return res.status(400).json({ message: "Cart is empty" });

    const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0);
    const discount = 0; // promo later
    const finalAmount = total - discount;

    await conn.beginTransaction();

    // create order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, address_id, total_amount, discount_amount, final_amount, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, address_id, total, discount, finalAmount]
    );

    const orderId = orderResult.insertId;

    // insert order items
    for (const it of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, qty, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, it.product_id, it.qty, it.price]
      );
    }

    // clear cart items + mark cart ordered
    await conn.query("DELETE FROM cart_items WHERE cart_id=?", [cartId]);
    await conn.query("UPDATE carts SET status='ordered' WHERE cart_id=?", [cartId]);

    await conn.commit();

    res.status(201).json({ message: "Order placed", order_id: orderId, total: Number(total.toFixed(2)) });
  } catch (err) {
    await conn.rollback();
    console.error("placeOrder error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await pool.query(
      `SELECT order_id, final_amount, status, created_at
       FROM orders
       WHERE user_id=?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { order_id } = req.params;

    const [orderRows] = await pool.query(
      `SELECT * FROM orders WHERE order_id=? AND user_id=? LIMIT 1`,
      [order_id, userId]
    );
    if (!orderRows.length) return res.status(404).json({ message: "Order not found" });

    const [items] = await pool.query(
      `SELECT oi.order_item_id, oi.qty, oi.price,
              p.product_id, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    res.json({ order: orderRows[0], items });
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
