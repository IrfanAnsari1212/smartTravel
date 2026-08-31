const express = require("express");
const { getPointWeather, getRouteWeather } = require("../controllers/weatherController");

const router = express.Router();

router.get("/point", getPointWeather);
router.post("/route", getRouteWeather);

module.exports = router;

