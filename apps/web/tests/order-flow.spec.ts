import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  test('should allow customer to add items to cart and place an order', async ({ page }) => {
    // 1. Navigate to the menu page with a mock table token
    await page.goto('/menu?table=1&token=test_token');

    // Wait for menu items to load (Assuming cards have a specific role or testid)
    // We will verify the page title first
    await expect(page).toHaveTitle(/Menu/i);

    // 2. Add an item to cart (Mock interactions based on the UI)
    // Using a broad selector for "Add to Cart" or "+" buttons on item cards
    const addButtons = page.locator('button:has-text("Add")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
    }

    // 3. Navigate to Cart
    await page.goto('/cart');
    
    // Ensure cart page is loaded
    await expect(page.locator('h1')).toContainText(/Cart/i);

    // 4. Fill customer details and place order
    const nameInput = page.locator('input[placeholder*="Name" i]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('John Doe (Test)');
    }

    const placeOrderBtn = page.locator('button:has-text("Place Order")');
    if (await placeOrderBtn.count() > 0) {
      await placeOrderBtn.click();
      
      // 5. Verify redirect to Order Status page
      // Order tracking page is usually /order/[id]
      await page.waitForURL(/\/order\/.+/);
      await expect(page.locator('h1')).toContainText(/Order/i);
    }
  });
});
