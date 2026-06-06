# QR Code Generator Service Implementation Plan

This plan covers building the QR Code generation, styling, PDF rendering, Cloudinary upload, and scan tracking functionalities.

## User Review Required

> [!IMPORTANT]
> **Cloudinary Configuration**: You will need to provide a `CLOUDINARY_URL` in your `.env` file (e.g., `cloudinary://<api_key>:<api_secret>@<cloud_name>`) for the image uploads to work.

## Open Questions

> [!WARNING]
> **Scan Tracking Mechanism**: The requirements state that the QR code should point directly to the frontend URL (`https://{restaurant_slug}.app.com/menu...`), but also requests a tracking middleware. If the QR code points directly to the frontend, the Express backend won't see the initial request. 
> 
> **Option A**: We make the QR point to a backend route (e.g., `https://api.yourapp.com/qr/scan/{table_id}`), which logs the scan and immediately redirects to the frontend.
> **Option B**: We keep the QR pointing to the frontend, and add tracking logic in the Next.js app (either via a Next.js API route/middleware that logs to the DB, or the frontend makes a quick POST request on mount). 
> 
> *I will plan for Option A (Backend Redirect) as it's the most robust way to track the raw scan event, but let me know if you prefer Option B!*

## Proposed Changes

### 1. Database Schema Update
#### [MODIFY] [packages/database/prisma/schema.prisma](file:///c:/Users/jh404/OneDrive/Desktop/Order%20Pro/packages/database/prisma/schema.prisma)
- Add a new model `QrScanLog` to track scans.
```prisma
model QrScanLog {
  id           String     @id @default(cuid())
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  tableId      String
  table        Table      @relation(fields: [tableId], references: [id], onDelete: Cascade)
  ipHash       String     // Hashed IP for privacy
  userAgent    String?
  scannedAt    DateTime   @default(now())

  @@index([restaurantId])
  @@index([tableId])
}
```

### 2. Backend Dependencies
#### [MODIFY] [apps/api/package.json](file:///c:/Users/jh404/OneDrive/Desktop/Order%20Pro/apps/api/package.json)
- Install `sharp` (for compositing the logo over the QR code and applying colors).
- Install `pdf-lib` (for generating the bulk print-ready PDF).
- Install `cloudinary` (for storing the generated QR code images).
- *(Note: `qrcode` is already installed in the API workspace)*.

### 3. QR Generation & Styling Service
#### [NEW] `apps/api/src/services/qr.service.ts`
- Implement `generateTableQrCode`:
  1. Generates the QR data matrix using the `qrcode` library.
  2. Uses `sharp` to apply the restaurant's `themeColor`.
  3. Uses `sharp` to composite the restaurant's `logoUrl` in the center of the QR code.
  4. Uploads the final image buffer to Cloudinary.
  5. Updates the `Table` record with the new `qrCodeUrl`.

### 4. Bulk PDF Generation Service
#### [NEW] `apps/api/src/services/pdf.service.ts`
- Implement `generateBulkPdf`:
  1. Fetches all tables for a given `restaurant_id`.
  2. Uses `pdf-lib` to create an 8.5x11 PDF document.
  3. Draws multiple "cards" per page, placing the QR Code image, Table Number, Restaurant Name, and "Scan to Order" text.

### 5. API Endpoints & Tracking Middleware
#### [NEW] `apps/api/src/routes/qr.routes.ts`
- `POST /api/qr/generate`: Endpoint taking `{ restaurant_id, table_id, table_number }` to trigger the QR generation process.
- `GET /api/qr/bulk-pdf/:restaurantId`: Endpoint that generates and returns the PDF buffer directly in the response with `Content-Type: application/pdf`.
- `GET /api/qr/scan/:tableId`: **(Scan Tracking)** Endpoint that the QR code actually points to. It hashes the IP, extracts the User-Agent, logs the scan to `QrScanLog`, signs a JWT, and issues a 302 Redirect to `https://{slug}.app.com/menu?table={number}&token={jwt}`.

#### [MODIFY] [apps/api/src/app.ts](file:///c:/Users/jh404/OneDrive/Desktop/Order%20Pro/apps/api/src/app.ts)
- Mount the new `qr.routes.ts` under `/api/qr`.

## Verification Plan
1. **DB Migration**: Run `pnpm db:generate` and `pnpm db:push` to apply the new `QrScanLog` model.
2. **Build Test**: Run `pnpm build` across workspaces to ensure type safety.
3. **Manual Flow**: Send a POST request to generate a QR code, verify Cloudinary upload. Send a GET request to download the PDF, inspect the layout. Simulate a scan by hitting the scan route, verify the DB logs the scan and properly redirects.
