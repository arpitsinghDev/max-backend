require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db.js");
const { connectRedis } = require("./config/redis");
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded images
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // dev only
    await connectRedis();
    app.listen(PORT, () => console.log(`API running on :${PORT}`));
  } catch (e) {
    console.error("Boot error:", e);
    process.exit(1);
  }
})();
