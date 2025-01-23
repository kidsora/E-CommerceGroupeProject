const express = require("express");
const Commande = require("../models/commande");

const routerOrder = express.Router();

// Créer une nouvelle commande
routerOrder.post("/addOrder", async (req, res) => {
  try {
    const { client, products, statut } = req.body;
    const commande = new Commande({ client, products, statut });
    await commande.save();
    res.status(201).json(commande);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Récupérer toutes les commandes
routerOrder.get("/getAll", async (req, res) => {
  try {
    const commandes = await Commande.find();
    res.send(commandes);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Mettre à jour une commande
routerOrder.put("/updateOrder/:id", async (req, res) => {
  try {
    const commande = await Commande.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!commande) {
      return res.status(404).send();
    }
    res.send(commande);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Supprimer une commande
routerOrder.delete("/deleteOrder/:id", async (req, res) => {
  try {
    const commande = await Commande.findByIdAndDelete(req.params.id);
    if (!commande) {
      return res.status(404).send();
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = routerOrder;
