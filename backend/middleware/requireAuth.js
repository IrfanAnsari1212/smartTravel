const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication is required" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const userId = payload.sub || payload.id;
    if (!userId) {
      return res.status(401).json({ message: "Your session is invalid or has expired" });
    }
    req.user = { id: String(userId), email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or has expired" });
  }
};

module.exports = { requireAuth };
