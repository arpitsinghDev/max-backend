const jwt = require("jsonwebtoken");
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const signAccess = (payload) => jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
const signRefresh = (payload) => jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXP });
const verifyAccess = (t) => jwt.verify(t, ACCESS_SECRET);
const verifyRefresh = (t) => jwt.verify(t, REFRESH_SECRET);
module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
