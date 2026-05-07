import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  
  test('should successfully book a service', async ({ page }) => {
    // Note: Replace with a real service ID from your database
    const serviceId = 'cmosfrfss000b9wwxp8lub2c5'; 
    await page.goto(`/appointments/${serviceId}`);

    // Select a date (tomorrow to avoid "past slot" issues)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);

    // Select the first available slot
    const slotButton = page.locator('button:has-text(" - ")').first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    // Click Reserve
    await page.click('button:has-text("Réserver")');

    // Check for success notification
    const notification = page.locator('.toast');
    await expect(notification).toContainText('Rendez-vous réussi !');
  });

  test('should block booking when quota is reached', async ({ page }) => {
    // This test requires 13 existing appointments for the target date
    // In a real scenario, you would seed the DB before running this
    const serviceId = 'cmosfrfss000b9wwxp8lub2c5';
    await page.goto(`/appointments/${serviceId}`);

    // Assuming the date is already seeded with 13 appointments
    await page.click('button:has-text("Réserver")');

    const notification = page.locator('.toast');
    await expect(notification).toContainText('Le salon est complet pour cette journée');
  });

  test('should block booking when all 4 posts are taken for a slot', async ({ page }) => {
    const serviceId = 'cmosfrfss000b9wwxp8lub2c5';
    await page.goto(`/appointments/${serviceId}`);

    // Find a slot that is already full (seeded)
    const fullSlot = page.locator('text=Aucun créneau disponible');
    await expect(fullSlot).toBeVisible();
  });
});
