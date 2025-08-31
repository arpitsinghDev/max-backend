const { Op } = require("sequelize");
const User = require("../models/User.js");

exports.list = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  const where = search
    ? { [Op.or]: [{ email: { [Op.like]: `%${search}%` } }, { name: { [Op.like]: `%${search}%` } }] }
    : {};

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ["id", "email", "name", "role", "profileImage", "createdAt"],
    limit, offset, order: [["createdAt", "DESC"]],
  });

  res.json({ data: rows, page, totalPages: Math.ceil(count / limit), total: count });
};

exports.me = async (req, res) => {
  const user = await User.findByPk(req.user.userId, { attributes: ["id","email","name","role","profileImage","isEmailVerified"] });
  res.json({ user: user });
};

exports.updateMe = async (req, res) => {
  const user = await User.findByPk(req.user.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { name } = req.body;
  if (name !== undefined) user.name = name;
  if (req.file) user.profileImage = req.file.filename;

  await user.save();
  res.json({ message: "Profile updated", user: { id: user.id, email: user.email, name: user.name, profileImage: user.profileImage } });
};

exports.getPublic = async (req, res) => {
  const user = await User.findByPk(req.params.id, { attributes: ["id","name","profileImage","createdAt"] });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: user });
};
