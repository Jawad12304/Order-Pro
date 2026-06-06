import request from "supertest";
import app from "../../app";

describe("API Routes Integration Tests", () => {
  describe("Health Check", () => {
    it("should return 200 OK from /health", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
    });
  });

  describe("Zod Validation: POST /api/orders", () => {
    it("should return 400 Bad Request if schema is invalid", async () => {
      const response = await request(app)
        .post("/api/orders")
        .send({
          // Missing restaurantId and items
          tableId: "table_1",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input");
      expect(response.body.details).toBeDefined();
    });

    it("should return 201 Created if schema is valid", async () => {
      const response = await request(app)
        .post("/api/orders")
        .send({
          restaurantId: "rest_1",
          tableId: "table_1",
          items: [
            { menuItemId: "item_1", quantity: 2 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
    });
  });

  describe("Security Headers", () => {
    it("should return Helmet security headers", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["x-dns-prefetch-control"]).toBe("off");
      expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    });
  });
});
