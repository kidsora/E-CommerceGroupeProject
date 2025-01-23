const mongoose = require("mongoose");

const commandeSchema = new mongoose.Schema({
  products:[ {
    name: {
      type: String,
      required: true,
    },
    description:{
        type: String,
        required: true,
      },
  
    price: {
      type: Number,
      required: true,
    }, 
    
    category: {
      type: String,
      required: true,
    },
  quantite: {
    type: Number,
    required: true,}
 } ],
  client: {
    type: String,
  //  required: true,
  },
  statut: {
    type: String,
    enum: ["En cours", "Terminée", "Annulée"],
    default: "En cours",
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
});

const Commande = mongoose.model("Commande", commandeSchema);

module.exports = Commande;
