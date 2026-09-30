const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");

const emailSchema = z.string().trim().email("Please enter a valid email address (e.g. name@example.com)").max(254);

// New accounts must use a password of exactly 4 characters.
const registerSchema = z.object({
  email: emailSchema,
  password: z.string().length(4, "Password must be exactly 4 characters long"),
});

// Login accepts any length so accounts created earlier with longer passwords still work.
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

const createSessionResponse = (user) => ({
  token: jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    algorithm: "HS256", subject: user.id, expiresIn: "7d",
  }),
  user: { id: user.id, email: user.email },
});

const register = async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
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
    const { email, password } = loginSchema.parse(req.body);
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
