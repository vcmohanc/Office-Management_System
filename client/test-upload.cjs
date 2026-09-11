const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message, error.stack));

  try {
    await page.goto('http://localhost:5174/dashboard');
    // We are on dashboard, need to log in or wait for redirect
    if (await page.url().includes('/login')) {
      await page.fill('input[type="text"]', 'testuser'); // if there is a login
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    }

    // wait for dashboard to load
    await page.waitForSelector('text=Support Department');
    
    // click Support Department to open Staff Claim Request
    await page.click('text=Support Department');
    
    // Wait for the form to appear
    await page.waitForSelector('text=Staff Claim Request');

    // Find the file input
    const fileInput = await page.$('input[type="file"]');
    
    // Upload a dummy file
    const tempFile = path.join(__dirname, 'dummy.txt');
    fs.writeFileSync(tempFile, 'dummy content');
    
    await fileInput.setInputFiles(tempFile);
    
    // wait a bit to let the error happen
    await page.waitForTimeout(2000);
    
    fs.unlinkSync(tempFile);
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
