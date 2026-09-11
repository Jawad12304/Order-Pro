// ==========================================
// Order-Pro — Root Hostinger Startup Gateway
// ==========================================
const path = require("path");

const appType = process.env.APP_TYPE || "web";

if (appType === "api") {
  console.log("🚀 [Hostinger] Booting Order-Pro API Service...");
  require("./apps/api/server.js");
} else {
  console.log("🚀 [Hostinger] Booting Order-Pro Web Application...");
  require("./apps/web/server.js");
}
