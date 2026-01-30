const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");


// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");

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


module.exports = app;