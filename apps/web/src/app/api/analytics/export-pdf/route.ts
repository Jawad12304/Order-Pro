import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  try {
    // In production, generating PDF via Puppeteer in a Next.js serverless route
    // requires 'puppeteer-core' and chromium-bidi or @sparticuz/chromium.
    // For this demonstration, we use standard puppeteer which works locally.
    
    // We launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // We navigate to the analytics dashboard. 
    // Usually, we'd pass an auth token or use a special ?print=true parameter to hide UI elements.
    // Using localhost for local generation.
    const targetUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/analytics?print=true` 
      : 'http://localhost:3000/dashboard/analytics?print=true';
      
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    // Return the PDF buffer
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="analytics-report.pdf"'
      }
    });

  } catch (error: any) {
    console.error("PDF Export Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF report" }, { status: 500 });
  }
}
