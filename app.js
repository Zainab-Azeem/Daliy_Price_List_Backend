const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");


// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");

// const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/address.routes");
const orderRoutes = require("./routes/orders.routes");
// const favouriteRoutes = require("./routes/favourite.routes");


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(
  cors({
    // origin: "http://localhost:5000", // frontend
    origin: "*",
    credentials: false,
  })
);



// ---------------- ROUTES ----------------
app.use("/auth", authRoutes);
app.use("/products", productRoutes);

// app.use("/categories", categoryRoutes);
app.use("/cart", cartRoutes);
app.use("/addresses", addressRoutes);
app.use("/orders", orderRoutes);
// app.use("/favourites", favouriteRoutes);





module.exports = app;