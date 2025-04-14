require("dotenv").config();
const express = require("express");
const path=require('path');
const mongoose = require("mongoose");
const session = require("express-session");
const User = require("./Database/user.js");
const app = express();
const connectDB = require('./Database/connection');
connectDB();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(path.join(__dirname, 'public'))); 


app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,                                                                                                                                                                                                                                                                                                                                                                                                                                                                
      saveUninitialized: true,
    })
);

app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

app.get("/wealthtax",  (req, res) => res.render("wealthtax"));
app.get("/watertax",  (req, res) => res.render("watertax"));
app.get("/housetax",  (req, res) => res.render("housetax"));
app.get("/library",  (req, res) => res.render("library"));
app.get("/contact",  (req, res) => res.render("contact"));


app.get("/cart", (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  res.render("cart", { cart: req.session.cart });
});


app.post("/cart/add", (req, res) => {
  const { name, price, cartFromFrontend } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "Item name and price are required." });
  }

  req.session.cart = cartFromFrontend || req.session.cart || [];
  req.session.cart.push({ name, price: parseFloat(price) });

  console.log("Updated Cart:", req.session.cart);
  res.json({ success: true, cart: req.session.cart });
});


app.post("/cart/remove", (req, res) => {
  const { itemIndex } = req.body;
  if (req.session.cart && req.session.cart.length > itemIndex) {
    req.session.cart.splice(itemIndex, 1);
  }
  res.json({ success: true, cart: req.session.cart });
});


app.get("/payment", (req, res) => {

  

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const total = req.session.cart.reduce((sum, item) => sum + (item.price ? parseFloat(item.price) : 0), 0);
  res.render("payment", { total });
});


app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  console.log("Received Data:", req.body);
  const { firstname, lastname, house_number, address, phone, email, password } = req.body;

  if (!firstname || !lastname || !house_number || !address || !phone || !email || !password) {
    console.log("❌ Missing Fields Detected!");
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const newUser = new User({ firstname, lastname, house_number, address, phone, email, password });
    await newUser.save();

    res.redirect("/login");
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/login", (req, res) => {
  res.render("login"); 
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email, password });

      if (!user) {
          return res.json({ success: false, error: "❌ Invalid email or password." });
      }

      console.log(`✅ Login successful! User: ${user.firstname}`);

      res.json({ success: true });
  } catch (error) {
      console.error("Login Error:", error);
      res.json({ success: false, error: "Internal server error" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
  console.log("logout successfully");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
