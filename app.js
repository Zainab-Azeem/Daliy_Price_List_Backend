const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");



// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");

const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/address.routes");
const orderRoutes = require("./routes/orders.routes");
const categoryRoutes = require("./routes/category.routes");
const favouriteRoutes = require("./routes/favourite.routes");
const userRoutes = require("./routes/users.routes");
const suggestionRoutes = require("./routes/suggestion.routes");


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(
  cors({
    // origin: "http://localhost:5000", // frontend
    // origin:"*",
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);



// ---------------- ROUTES ----------------
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/users", userRoutes);

app.use("/cart", cartRoutes);
app.use("/addresses", addressRoutes);
app.use("/orders", orderRoutes);
app.use("/categories", categoryRoutes);
app.use("/favourites", favouriteRoutes);
app.use("/suggestions", suggestionRoutes);





module.exports = app;