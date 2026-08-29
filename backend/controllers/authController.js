const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

const createSessionResponse = (user) => ({
  token: jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    algorithm: "HS256", subject: user.id, expiresIn: "7d",
  }),
  user: { id: user.id, email: user.email },
});

const register = async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({ email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    return res.status(201).json(createSessionResponse(user));
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.json(createSessionResponse(user));
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = (req, res) => res.json({ user: req.user });
module.exports = { getCurrentUser, login, register };
