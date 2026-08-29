const express = require("express");
const { searchHotels } = require("../controllers/hotelController");

const router = express.Router();

// Allow both POST and GET for versatile search
router.post("/search", searchHotels);
router.get("/search", searchHotels);

module.exports = router;

