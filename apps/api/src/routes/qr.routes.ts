import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@order-pro/database";
import { requireAuth, requireTenant, requireRole } from "../middleware/auth";
import { QrService } from "../services/qr.service";
import { PdfService } from "../services/pdf.service";

const router = Router();

const generateSchema = z.object({
  restaurantId: z.string(),
  tableId: z.string(),
  tableNumber: z.number(),
});

/**
 * POST /api/qr/generate
 * Generates and uploads a single QR Code for a table.
 */
router.post(
  "/generate",
  requireAuth,
  requireTenant,
  requireRole(["OWNER", "MANAGER"]),
  async (req: Request, res: Response) => {
    try {
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request payload", details: parsed.error });
      }

      // Ensure tenant matches
      if (req.restaurant?.id !== parsed.data.restaurantId) {
        return res.status(403).json({ error: "Tenant mismatch" });
      }

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parsed.data.restaurantId },
      });

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const qrCodeUrl = await QrService.generateTableQrCode({
        ...parsed.data,
        slug: restaurant.slug,
        themeColor: restaurant.themeColor,
        logoUrl: restaurant.logoUrl,
      });

      res.status(200).json({ success: true, qrCodeUrl });
    } catch (error) {
      console.error("QR Generation Error:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  }
);

/**
 * GET /api/qr/bulk-pdf/:restaurantId
 * Returns a PDF document with all QR code cards for the restaurant.
 */
router.get(
  "/bulk-pdf/:restaurantId",
  requireAuth,
  requireTenant,
  requireRole(["OWNER", "MANAGER"]),
  async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;

      if (req.restaurant?.id !== restaurantId) {
        return res.status(403).json({ error: "Tenant mismatch" });
      }

      const pdfBuffer = await PdfService.generateBulkPdf(restaurantId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="qr-codes-${req.restaurant.slug}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Bulk PDF Error:", error);
      res.status(500).json({ error: "Failed to generate Bulk PDF" });
    }
  }
);

/**
 * GET /api/qr/scan/:tableId
 * Public endpoint. Scanned by a user's phone.
 * Logs the scan to QrScanLog and redirects to the frontend with a signed JWT.
 */
router.get("/scan/:tableId", async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true },
    });

    if (!table) {
      return res.status(404).send("Table not found");
    }

    // Hash the IP address for privacy
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    const ipHash = crypto.createHash("sha256").update(ipStr).digest("hex");
    
    const userAgent = req.headers["user-agent"] || "unknown";

    // Log the scan asynchronously (don't block the redirect)
    prisma.qrScanLog.create({
      data: {
        tableId: table.id,
        restaurantId: table.restaurantId,
        ipHash,
        userAgent,
      },
    }).catch((err: any) => console.error("Failed to log QR scan:", err));

    // Sign a temporary JWT for the customer session
    // Uses the JWT secret (or another secret if preferred)
    const token = jwt.sign(
      {
        tableId: table.id,
        restaurantId: table.restaurantId,
        role: "CUSTOMER",
      },
      process.env.SUPABASE_JWT_SECRET || "fallback-secret",
      { expiresIn: "4h" }
    );

    // Redirect to frontend menu
    // https://{restaurant_slug}.app.com/menu?table={table_number}&token={signed_jwt}
    // Using localhost for development fallback
    const frontendBase = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.replace("://", `://${table.restaurant.slug}.`)
      : `http://${table.restaurant.slug}.localhost:3000`;

    const redirectUrl = `${frontendBase}/menu?table=${table.number}&token=${token}`;
    
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Scan Tracking Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
