const express = require('express');
const deliveryRouter = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Create a new delivery
deliveryRouter.post('/', deliveryController.createDelivery);

// Get all deliveries
deliveryRouter.get('/', deliveryController.getAllDeliveries);

// Get a specific delivery by ID
deliveryRouter.get('/:id', deliveryController.getDeliveryById);

// Update a delivery
deliveryRouter.patch('/:id', deliveryController.updateDelivery);

// Delete a delivery
deliveryRouter.delete('/:id', deliveryController.deleteDelivery);

module.exports = router;