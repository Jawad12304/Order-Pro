export class OrderService {
  /**
   * Calculates the grand total of an order including all modifiers and quantities
   */
  static calculateTotal(
    items: { unitPrice: number; quantity: number; modifiers?: { priceDelta: number }[] }[],
    taxRate: number = 0.08
  ) {
    const subtotal = items.reduce((sum, item) => {
      const modifierSum = item.modifiers?.reduce((modSum, mod) => modSum + mod.priceDelta, 0) || 0;
      return sum + (item.unitPrice + modifierSum) * item.quantity;
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }
}
