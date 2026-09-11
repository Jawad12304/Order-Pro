// ==========================================
// Order-Pro Web — Hostinger Startup File
// ==========================================
const path = require("path");
const fs = require("fs");

const standaloneServer = path.join(__dirname, ".next", "standalone", "apps", "web", "server.js");

if (fs.existsSync(standaloneServer)) {
  console.log("🚀 Starting Next.js via Standalone Server...");
  require(standaloneServer);
} else {
  console.log("🚀 Starting Next.js via standard production server...");
  const { createServer } = require("http");
  const next = require("next");

  const app = next({ dev: false, dir: __dirname });
  const handle = app.getRequestHandler();
  const port = parseInt(process.env.PORT || "3000", 10);

  app.prepare().then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> Order-Pro Web ready on port ${port}`);
    });
  });
}
