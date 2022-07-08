const express = require("express");
const mongoose = require("mongoose");

//connexion à la bdd
mongoose.connect("mongodb://127.0.0.1/Vinted-orion");

const app = express();
app.use(express.json());

//import des routes users et offers
const usersRoutes = require("./routes/users");
app.use(usersRoutes);
const offersRoutes = require("./routes/offers");
app.use(offersRoutes);

app.all("*", (req, res) => {
  res.status(400).json("Route introuvable");
});

app.listen(3000, () => {
  console.log("Server has started ! 🚀🚀🚀");
});
