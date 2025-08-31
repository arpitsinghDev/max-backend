const { verifyAccess } = require("../utility/jwt");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  const token = header.split(" ")[1];
  try {
    const payload = verifyAccess(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid/expired token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { authenticate, requireRole };
