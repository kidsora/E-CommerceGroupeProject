const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  
  deliveryDate: { type: Date, required: true },

  deliveryMethod: {
    type: String,
    enum: ["Standard", "Express", "Local Pickup", "In-Store"],
    default: "Standard",
  },
  deliveryCost: { type: Number, required: true },
  
  deliveryStatus: {
    type: String,
    enum: [
      "Pending",
      "Assigned",
      "Out for Delivery",
      "Delivered",
      "Failed",
      "Returned",
    ],
    default: "Pending",
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
});

module.exports = mongoose.model("Delivery", deliverySchema);
