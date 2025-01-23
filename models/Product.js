const mongoose = require("mongoose");
//ski
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    instock: { type: Boolean },
    category: { type: String, required: true },
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
