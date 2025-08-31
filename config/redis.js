const { createClient } = require("redis");
const client = createClient({ 
    url: process.env.REDIS_URL || "redis://localhost:6379"
});
client.on("error", (e) => console.error("Redis error:", e));
async function connectRedis(){ if (!client.isOpen) await client.connect(); }
module.exports = { client, connectRedis };