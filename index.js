const http = require("http");
const mongoose = require("mongoose");

require("dotenv").config();
mongoose
  .connect(
    "mongodb+srv://useContact:test1@cluster2.ogcau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

const express = require("express");
const app = express();
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", "./views/users");
app.use(express.static("public"));

const userRoute = require("./routes/userRoute");
const routerOrder = require("./routes/routesCommandes");
app.use("/user", userRoute);
app.use("/orders", routerOrder);

app.get("/register", (req, res) => {
  res.render("registration/registration");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server is running...");
});
