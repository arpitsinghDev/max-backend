const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/db.js");

const User = sequelize.define("User", {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: "user" },
  profileImage: { type: DataTypes.STRING },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "users", timestamps: true });

User.beforeCreate(async (u) => {
  u.password = await bcrypt.hash(u.password, 10);
});
User.beforeUpdate(async (u) => {
  if (u.changed("password")) u.password = await bcrypt.hash(u.password, 10);
});
User.prototype.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = User;
