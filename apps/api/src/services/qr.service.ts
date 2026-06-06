import QRCode from "qrcode";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@order-pro/database";

// Initialize Cloudinary
// Ensure CLOUDINARY_URL is present in the environment
cloudinary.config({
  secure: true,
});

interface GenerateQrParams {
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  slug: string;
  themeColor?: string | null;
  logoUrl?: string | null;
}

export class QrService {
  /**
   * Generates a styled QR code, uploads it to Cloudinary, and saves it to the Table record.
   */
  static async generateTableQrCode(params: GenerateQrParams): Promise<string> {
    const { restaurantId, tableId, tableNumber, slug, themeColor, logoUrl } = params;

    // The frontend URL the QR code points to (backend redirect handles the tracking)
    // Wait, the plan was to point to the backend tracking route:
    const baseUrl = process.env.API_URL || "http://localhost:5000";
    const trackingUrl = `${baseUrl}/api/qr/scan/${tableId}`;

    // 1. Generate base QR code as a buffer
    // We generate a high-res, error-correction level H so the logo doesn't break it
    const qrBuffer = await QRCode.toBuffer(trackingUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      margin: 2,
      width: 1000,
      color: {
        dark: themeColor?.replace("#", "") || "000000",
        light: "FFFFFF",
      },
    });

    let finalImageBuffer = qrBuffer;

    // 2. Composite Logo using sharp (if provided)
    if (logoUrl) {
      try {
        // Fetch the logo image
        const logoResponse = await fetch(logoUrl);
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer = Buffer.from(logoArrayBuffer);

        // Resize logo to 20% of QR code width (200px)
        const resizedLogo = await sharp(logoBuffer)
          .resize(200, 200, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toBuffer();

        // Composite the logo onto the center of the QR code
        finalImageBuffer = await sharp(qrBuffer)
          .composite([
            {
              input: resizedLogo,
              gravity: "center",
            },
          ])
          .png()
          .toBuffer();
      } catch (error) {
        console.error("Failed to composite logo, falling back to base QR:", error);
      }
    }

    // 3. Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `order-pro/restaurants/${restaurantId}/qrcodes`,
          public_id: `table_${tableNumber}`,
          overwrite: true,
        },
        async (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Cloudinary upload failed with no result"));

          // 4. Save the generated URL to the database
          await prisma.table.update({
            where: { id: tableId },
            data: { qrCodeUrl: result.secure_url },
          });

          resolve(result.secure_url);
        }
      );

      // Write the buffer to the upload stream
      uploadStream.end(finalImageBuffer);
    });
  }
}
