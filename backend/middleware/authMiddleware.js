// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Verify JWT from Authorization header (`Bearer <token>`) or `token` cookie.
 * Adds `req.user` (decoded payload) on success.
 */
function authenticate(req, res, next) {
  const headerToken =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null;
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({
      message: "Not authenticated",
      success: false,
      error: true,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
      error: true,
    });
  }
}

module.exports = authenticate;
