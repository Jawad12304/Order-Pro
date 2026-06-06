import { OrderService } from "../OrderService";

describe("OrderService", () => {
  describe("calculateTotal", () => {
    it("should calculate correct totals for basic items", () => {
      const items = [
        { unitPrice: 10, quantity: 2 },
        { unitPrice: 5, quantity: 1 }
      ];
      
      const result = OrderService.calculateTotal(items, 0.1); // 10% tax
      
      expect(result.subtotal).toBe(25);
      expect(result.tax).toBe(2.5);
      expect(result.total).toBe(27.5);
    });

    it("should correctly apply modifier price deltas", () => {
      const items = [
        { 
          unitPrice: 10, 
          quantity: 1, 
          modifiers: [{ priceDelta: 2 }, { priceDelta: 0.5 }] 
        }
      ];
      
      const result = OrderService.calculateTotal(items, 0); // 0% tax
      
      expect(result.subtotal).toBe(12.5);
      expect(result.total).toBe(12.5);
    });

    it("should correctly multiply modifiers by quantity", () => {
      const items = [
        { 
          unitPrice: 10, 
          quantity: 3, 
          modifiers: [{ priceDelta: 2 }] 
        } // (10 + 2) * 3 = 36
      ];
      
      const result = OrderService.calculateTotal(items, 0.1); // 10% tax
      
      expect(result.subtotal).toBe(36);
      expect(result.tax).toBe(3.6);
      expect(result.total).toBe(39.6);
    });
  });
});
