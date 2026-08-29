const express = require("express");
const { getCurrentUser, login, register } = require("../controllers/authController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);
module.exports = router;
