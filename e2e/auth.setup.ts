import { test, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

test('authenticate', async ({ page }) => {
  console.log('Starting authentication flow...');
  
  // Navigate to the app's root or login page to trigger Kinde redirect
  await page.goto('/'); 
  
  // If not logged in, Kinde usually has a "Login" button or redirects automatically
  // Let's try to go directly to the login route if possible, or just click login
  await page.goto('/api/auth/login');

  console.log('Waiting for Kinde login page...');
  // Wait for the email input to be visible on the Kinde page
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  console.log('Entering email...');
  await page.fill('input[type="email"]', 'mrpfouapo@gmail.com');
  await page.click('button[type="submit"]');

  console.log('Waiting for password field...');
  // Kinde often has a transition between email and password
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  
  console.log('Entering password...');
  await page.fill('input[type="password"]', 'Obenilass@789123');
  await page.click('button[type="submit"]');

  console.log('Waiting for redirect back to app...');
  // Wait for any URL that indicates success (dashboard or root)
  await page.waitForURL(/.*(dashboard|appointments).*/, { timeout: 30000 });
  
  console.log('Authentication successful. Saving state...');
  await page.context().storageState({ path: authFile });
});
