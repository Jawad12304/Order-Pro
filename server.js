// ==========================================
// Order-Pro — Root Hostinger Startup Gateway
// Supports both Unified Single-Domain (Temporary Domains)
// and Split Domain (api.domain.com + domain.com)
// ==========================================
const http = require("http");
const net = require("net");
const path = require("path");

const appType = process.env.APP_TYPE || "unified";

if (appType === "api") {
  console.log("🚀 [Hostinger] Booting standalone Order-Pro API Service...");
  require("./apps/api/server.js");
} else if (appType === "web") {
  console.log("🚀 [Hostinger] Booting standalone Order-Pro Web Application...");
  require("./apps/web/server.js");
} else {
  // UNIFIED MODE: Runs Frontend + Backend API + WebSockets on 1 single domain / port
  console.log("🚀 [Hostinger] Booting Unified Order-Pro (Frontend + Backend + Sockets on 1 domain)...");

  const port = parseInt(process.env.PORT || "3000", 10);
  const internalApiPort = parseInt(process.env.INTERNAL_API_PORT || "5000", 10);

  // 1. Boot internal API on internal port
  process.env.PORT = String(internalApiPort);
  require("./apps/api/server.js");

  // Restore main PORT for Hostinger's gateway
  process.env.PORT = String(port);

  // 2. Prepare Next.js
  const next = require("next");
  const nextApp = next({ dev: false, dir: path.join(__dirname, "apps", "web") });
  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    const server = http.createServer((req, res) => {
      // Check if this request belongs to the backend Express API
      const isApiRoute =
        req.url.startsWith("/api/auth") ||
        req.url.startsWith("/api/users") ||
        req.url.startsWith("/api/notify") ||
        req.url.startsWith("/api/webhooks") ||
        req.url === "/health";

      if (isApiRoute) {
        proxyHttp(req, res, internalApiPort);
      } else {
        handle(req, res);
      }
    });

    // Handle WebSocket upgrades for live orders/kitchen updates
    server.on("upgrade", (req, socket, head) => {
      if (req.url.startsWith("/socket.io")) {
        proxyUpgrade(req, socket, head, internalApiPort);
      } else {
        socket.destroy();
      }
    });

    server.listen(port, () => {
      console.log(`=======================================================`);
      console.log(`🎉 Order-Pro Unified Server running on port ${port}`);
      console.log(`🌐 Web App:      http://localhost:${port}`);
      console.log(`🔌 Backend API:  http://localhost:${port}/api`);
      console.log(`⚡ WebSocket:    ws://localhost:${port}/socket.io`);
      console.log(`=======================================================`);
    });
  });
}

function proxyHttp(req, res, targetPort) {
  const options = {
    hostname: "127.0.0.1",
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${targetPort}`,
      "x-forwarded-host": req.headers.host || "",
      "x-forwarded-proto": req.headers["x-forwarded-proto"] || "http",
      "x-forwarded-for": req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`[Gateway Proxy Error] ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backend API unavailable", details: err.message }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

function proxyUpgrade(req, socket, head, targetPort) {
  const proxySocket = net.connect(targetPort, "127.0.0.1", () => {
    proxySocket.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
      Object.keys(req.headers)
        .map((k) => `${k}: ${req.headers[k]}`)
        .join("\r\n") +
      "\r\n\r\n"
    );
    if (head && head.length > 0) {
      proxySocket.write(head);
    }
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxySocket.on("error", (err) => {
    console.error("[Gateway Upgrade Error]:", err.message);
    socket.destroy();
  });
}
