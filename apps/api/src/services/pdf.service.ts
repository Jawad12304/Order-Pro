import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { prisma } from "@order-pro/database";

export class PdfService {
  /**
   * Generates a PDF containing QR code cards for all tables in a restaurant.
   */
  static async generateBulkPdf(restaurantId: string): Promise<Buffer> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        tables: {
          orderBy: { number: "asc" },
        },
      },
    });

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Page dimensions (8.5 x 11 inches at 72 PPI)
    const PAGE_WIDTH = 612;
    const PAGE_HEIGHT = 792;
    
    // Card dimensions
    const CARD_WIDTH = 250;
    const CARD_HEIGHT = 350;
    const MARGIN_X = (PAGE_WIDTH - (CARD_WIDTH * 2)) / 3; // 2 columns
    const MARGIN_Y = 50;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let xPos = MARGIN_X;
    let yPos = PAGE_HEIGHT - MARGIN_Y - CARD_HEIGHT;
    let col = 0;
    let row = 0;

    for (const table of restaurant.tables) {
      if (!table.qrCodeUrl) continue;

      // Draw Card Border
      page.drawRectangle({
        x: xPos,
        y: yPos,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      // Draw Restaurant Name
      page.drawText(restaurant.name, {
        x: xPos + 20,
        y: yPos + CARD_HEIGHT - 40,
        size: 16,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Fetch and embed the QR Code image
      try {
        const qrResponse = await fetch(table.qrCodeUrl);
        const qrArrayBuffer = await (qrResponse as any).arrayBuffer();
        const qrImage = await pdfDoc.embedPng(qrArrayBuffer);
        
        const qrSize = 150;
        page.drawImage(qrImage, {
          x: xPos + (CARD_WIDTH - qrSize) / 2,
          y: yPos + (CARD_HEIGHT - qrSize) / 2 + 10,
          width: qrSize,
          height: qrSize,
        });
      } catch (err) {
        console.error(`Failed to embed QR for table ${table.number}`, err);
      }

      // Draw "Scan to Order"
      page.drawText("Scan to Order", {
        x: xPos + 80,
        y: yPos + 60,
        size: 14,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Draw Table Number
      page.drawText(`Table ${table.number}`, {
        x: xPos + 90,
        y: yPos + 30,
        size: 18,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Move to next position
      col++;
      if (col > 1) {
        col = 0;
        row++;
        yPos -= (CARD_HEIGHT + 20);
        xPos = MARGIN_X;
      } else {
        xPos += CARD_WIDTH + MARGIN_X;
      }

      // Create new page if full
      if (row > 1) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        col = 0;
        row = 0;
        xPos = MARGIN_X;
        yPos = PAGE_HEIGHT - MARGIN_Y - CARD_HEIGHT;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
