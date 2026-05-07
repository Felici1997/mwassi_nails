import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {

  test('should access admin dashboard', async ({ page }) => {
    // Replace with a real salonId
    const salonId = 'salon_123'; 
    await page.goto(`/admin/${salonId}`);

    await expect(page).toHaveURL(new RegExp(`/admin/${salonId}`));
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should be able to add a new service', async ({ page }) => {
    const salonId = 'salon_123';
    await page.goto(`/admin/${salonId}/services`);

    await page.click('button:has-text("Ajouter")');
    await page.fill('input[name="name"]', 'Test Service');
    await page.fill('input[name="price"]', '5000');
    await page.fill('input[name="duration"]', '30');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Test Service')).toBeVisible();
  });
});
