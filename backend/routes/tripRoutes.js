const express = require("express");
const router = express.Router();

const { planTrip } = require("../controllers/tripController");

router.post("/route", planTrip);

module.exports = router;