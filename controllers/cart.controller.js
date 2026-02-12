const pool = require("../config/db");

async function getOrCreateActiveCart(userId) {
  const [rows] = await pool.query(
    "SELECT cart_id FROM carts WHERE user_id=? AND status='active' LIMIT 1",
    [userId]
  );

  if (rows.length) return rows[0].cart_id;

  const [result] = await pool.query(
    "INSERT INTO carts (user_id, status) VALUES (?, 'active')",
    [userId]
  );

  return result.insertId;
}

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [cartRows] = await pool.query(
      "SELECT cart_id FROM carts WHERE user_id=? AND status='active' LIMIT 1",
      [userId]
    );

    if (!cartRows.length) return res.json({ items: [], total: 0 });

    const cartId = cartRows[0].cart_id;

    const [items] = await pool.query(
      `SELECT 
         ci.cart_item_id,
         ci.qty,
         p.product_id,
         p.name,
         p.price,
         p.image_url,
         (p.price * ci.qty) AS subtotal
       FROM cart_items ci
       JOIN products p ON p.product_id = ci.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    const total = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    res.json({ items, total: Number(total.toFixed(2)) });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id, qty } = req.body;

    if (!product_id) return res.status(400).json({ message: "product_id required" });

    const quantity = qty && Number(qty) > 0 ? Number(qty) : 1;

    // confirm product exists and active
    const [p] = await pool.query(
      "SELECT product_id FROM products WHERE product_id=? AND is_active=1 LIMIT 1",
      [product_id]
    );
    if (!p.length) return res.status(404).json({ message: "Product not found" });

    const cartId = await getOrCreateActiveCart(userId);

    // If same product already in cart -> increase qty
    const [exists] = await pool.query(
      "SELECT cart_item_id FROM cart_items WHERE cart_id=? AND product_id=? LIMIT 1",
      [cartId, product_id]
    );

    if (exists.length) {
      await pool.query(
        "UPDATE cart_items SET qty = qty + ? WHERE cart_item_id=?",
        [quantity, exists[0].cart_item_id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart_items (cart_id, product_id, qty) VALUES (?, ?, ?)",
        [cartId, product_id, quantity]
      );
    }

    res.status(201).json({ message: "Added to cart" });
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateCartItemQty = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { cart_item_id } = req.params;
    const { qty } = req.body;

    if (qty === undefined) return res.status(400).json({ message: "qty required" });

    const newQty = Number(qty);

    // ensure this cart_item belongs to logged in user
    const [rows] = await pool.query(
      `SELECT ci.cart_item_id
       FROM cart_items ci
       JOIN carts c ON c.cart_id = ci.cart_id
       WHERE ci.cart_item_id=? AND c.user_id=? AND c.status='active'`,
      [cart_item_id, userId]
    );

    if (!rows.length) return res.status(404).json({ message: "Cart item not found" });

    if (newQty <= 0) {
      await pool.query("DELETE FROM cart_items WHERE cart_item_id=?", [cart_item_id]);
      return res.json({ message: "Item removed" });
    }

    await pool.query("UPDATE cart_items SET qty=? WHERE cart_item_id=?", [newQty, cart_item_id]);
    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error("updateCartItemQty error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { cart_item_id } = req.params;

    const [result] = await pool.query(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON c.cart_id = ci.cart_id
       WHERE ci.cart_item_id=? AND c.user_id=? AND c.status='active'`,
      [cart_item_id, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item removed" });
  } catch (err) {
    console.error("removeCartItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [cartRows] = await pool.query(
      "SELECT cart_id FROM carts WHERE user_id=? AND status='active' LIMIT 1",
      [userId]
    );

    if (!cartRows.length) return res.json({ message: "Cart already empty" });

    await pool.query("DELETE FROM cart_items WHERE cart_id=?", [cartRows[0].cart_id]);

    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("clearCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
