const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

cloudinary.config({
  cloud_name: "burgoscloud",
  api_key: "916346833516432",
  api_secret: "dwdwUgR-iLLCGKKbNU2iyygQ-aI",
});

const Offer = require("../models/Offer");
const User = require("../models/User");

// 1 Créer une offre sans ref sans photo et sans le middleware
// 2 Créer une offre sans ref avec une photo
// 3 Créer une offre avec une ref avec une photo et avec le middleware

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const isAuthenticated = async (req, res, next) => {
  //   console.log(req.headers);
  // Cette condition sert à vérifier si j'envoie un token
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });
    // Cette condition sert à vérifier si j'envoie un token valide !

    if (user) {
      //Mon token est valide et je peux continuer
      //J'envoie les infos sur mon user à la route /offer/publish
      req.user = user;
      next();
    } else {
      res.status(401).json({ error: "Token présent mais non valide !" });
    }
  } else {
    res.status(401).json({ error: "Token non envoyé !" });
  }
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log(req.body);
      console.log(req.files);
      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brend },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        owner: req.user,
      });

      //J'envoie mon image sur cloudinary, juste après avoir crée en DB mon offre
      // Comme ça j'ai accès à mon ID
      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        {
          folder: "vinted/offers",
          public_id: `${req.body.title} - ${newOffer._id}`,
          //Old WAY JS
          // public_id: req.body.title + " " + newOffer._id,
        }
      );

      // console.log(result);
      //je viens rajouter l'image à mon offre
      newOffer.product_image = result;

      await newOffer.save();

      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  // product_price: { $gte: req.query.PriceMin, $lte: req.query.PriceMax }
  // const offers = await Offer.find({
  //   product_name: new RegExp("manteau", "i"),
  // });
  // //     .sort({ product_price: "ascending" })
  // //     .select("product_name product_price -_id");

  const offers = await Offer.find.select("product_name product_price -_id")({
    // gte => greater or equal
    // lte => lower or equal
    product_price: {
      $gte: req.query.PriceMin,
      $lte: req.query.PriceMax,
    },
    // product_name: new RegExp("req.query.title", "i"),
  });
  //     .select("product_name product_price -_id")
  //     .sort({ product_price: "descending" });
  //   res.json(offers);
  // const offers = await Offer.find()
  // .select("product_name product_price -_id");
  res.json(offers);
});

module.exports = router;
