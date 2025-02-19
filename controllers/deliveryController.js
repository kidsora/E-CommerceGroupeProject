const express = require("express");
const router = express.Router();
const Delivery = require("../models/deliveryCode"); // Import from deliveryCode.js

// Advanced: generate a unique delivery code
function generateDeliveryCode(orderId) {
  const prefix = "DLV"; // Static prefix
  const date = new Date().toISOString().split("T")[0].replace(/-/g, ""); // Format: YYYYMMDD
  return `${prefix}-${date}-${orderId}`;
}

// Advanced: Search and filter deliveries
router.get("/search", async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query; // Extract pagination and filters
    const query = {};

    // Build dynamic filters
    if (filters.deliveryStatus) query.deliveryStatus = filters.deliveryStatus;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.deliveryDate) query.deliveryDate = { $gte: new Date(filters.deliveryDate) }; // Example: filter by date

    // Fetch filtered deliveries with pagination
    const deliveries = await Delivery.find(query)
      .limit(limit * 1) // Convert to integer
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination metadata
    const total = await Delivery.countDocuments(query);

    res.json({
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      deliveries,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new delivery
router.post("/", async (req, res) => {
  try {
    const orderId = req.body.orderId; // Use provided orderId
    const deliveryCode = generateDeliveryCode(orderId); // Generate the unique delivery code

    const newDelivery = new Delivery({ ...req.body, deliveryCode }); // Add the code to the delivery
    const savedDelivery = await newDelivery.save();
    res.status(201).json(savedDelivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all deliveries
router.get("/", async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific delivery by ID
router.get("/:id", getDelivery, (req, res) => {
  res.json(res.delivery);
});

// Update a delivery
router.patch("/:id", getDelivery, async (req, res) => {
  try {
    if (req.body.orderId) res.delivery.orderId = req.body.orderId;
    if (req.body.deliveryDate) res.delivery.deliveryDate = req.body.deliveryDate;
    if (req.body.deliveryTime) res.delivery.deliveryTime = req.body.deliveryTime;
    if (req.body.deliveryMethod) res.delivery.deliveryMethod = req.body.deliveryMethod;
    if (req.body.deliveryCost) res.delivery.deliveryCost = req.body.deliveryCost;
    if (req.body.deliveryStatus) res.delivery.deliveryStatus = req.body.deliveryStatus;
    if (req.body.customerId) res.delivery.customerId = req.body.customerId;

    const updatedDelivery = await res.delivery.save();
    res.json(updatedDelivery);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a delivery
router.delete("/:id", getDelivery, async (req, res) => {
  try {
    await res.delivery.remove();
    res.json({ message: "Delivery Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to get delivery by ID
async function getDelivery(req, res, next) {
  let delivery;
  try {
    delivery = await Delivery.findById(req.params.id);
    if (delivery == null) {
      return res.status(404).json({ message: "Cannot find delivery" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.delivery = delivery;
  next();
}

module.exports = router;
