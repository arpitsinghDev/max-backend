const { signAccess, signRefresh, verifyRefresh } = require("../utility/jwt.js");
const { client: redis } = require("../config/redis.js");
const { sendMail } = require("../config/email.js");
const User = require("../models/User.js");
const jwt = require("jsonwebtoken");

const REFRESH_KEY = (id) => `refresh:${id}`;

function parseExpToSec(str = "7d") {
  if (/^\d+$/.test(str)) return +str;
  const [, n, u] = str.match(/^(\d+)([smhd])$/) || [];
  const x = +n || 7;
  return u === "s" ? x : u === "m" ? x * 60 : u === "h" ? x * 3600 : x * 86400;
}

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });

    const profileImage = req.file?.filename;
    const user = await User.create({ email, password, name, profileImage });

    // email verification token (short-lived)
    const token = jwt.sign(
      { userId: user.id },
      process.env.EMAIL_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Hi ${
        user.name || ""
      }, verify your email:</p><a href="${link}">${link}</a>`,
    });

    res.status(201).json({ message: "Registered. Check email to verify." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(400).json({ message: "Invalid link" });
    user.isEmailVerified = true;
    await user.save();
    res.json({ message: "Email verified" });
  } catch {
    res.status(400).json({ message: "Invalid/expired token" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ where: { email } });
    if (!u) return res.status(401).json({ message: "Invalid credentials" });
    if (!u.isEmailVerified)
      return res.status(403).json({ message: "Verify email first" });
    const ok = await u.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { userId: u.id, role: u.role, email: u.email };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    await redis.set(REFRESH_KEY(u.id), refreshToken, {
      EX: parseExpToSec(process.env.REFRESH_TOKEN_EXPIRES_IN),
    });
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: u.id,
        email: u.email,
        role: u.role,
        name: u.name,
        profileImage: u.profileImage,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refreshToken" });

    const decoded = verifyRefresh(refreshToken);
    const stored = await redis.get(REFRESH_KEY(decoded.userId));
    if (!stored || stored !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token" });

    const payload = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
    const newAccess = signAccess(payload);
    const newRefresh = signRefresh(payload);

    await redis.set(REFRESH_KEY(decoded.userId), newRefresh, {
      EX: parseExpToSec(process.env.REFRESH_TOKEN_EXPIRES_IN),
    });
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (e) {
    console.error(e);
    res.status(401).json({ message: "Invalid/expired refresh token" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const u = await User.findOne({ where: { email } });
    if (!u) return res.json({ message: "If account exists, email sent" }); // don’t leak
    const token = jwt.sign(
      { userId: u.id },
      process.env.PASSWORD_RESET_SECRET,
      { expiresIn: "1h" }
    );
    const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendMail({
      to: u.email,
      subject: "Reset password",
      html: `<a href="${link}">${link}</a>`,
    });
    res.json({ message: "If account exists, email sent" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.PASSWORD_RESET_SECRET);
    const u = await User.findByPk(decoded.userId);
    if (!u) return res.status(400).json({ message: "Invalid token" });
    u.password = password; // hook re-hashes
    await u.save();
    res.json({ message: "Password updated" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Invalid/expired token" });
  }
};

exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Missing userId" });
    await redis.del(REFRESH_KEY(userId));
    res.json({ message: "Logged out" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
