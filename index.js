const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

const app = express();
app.use(express.json());
app.use(express.static("public")); 

const userRoute = require("./routes/userRoute");
const routerOrder = require("./routes/routesCommandes");
const productRoutes = require("./routes/product");
const deliveryRoutes= require("./routes/deliveryRoutes")

app.use("/product", productRoutes);
app.use("/user", userRoute);
app.use("/orders", routerOrder);
app.use("/delivery",deliveryRoutes)

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
