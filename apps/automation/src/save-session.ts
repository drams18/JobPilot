import { chromium } from 'playwright';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

async function main() {
  const targetUrl = process.argv[2] ?? 'https://www.francetravail.fr/accueil/';
  const userId = process.argv[3] ?? 'default';
  const sessionsDir = resolve(__dirname, '../sessions');

  mkdirSync(sessionsDir, { recursive: true });
  const sessionPath = resolve(sessionsDir, `${userId}.json`);

  console.log(`Opening ${targetUrl}`);
  console.log('Log in manually in the browser window, then close it to save the session.');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  await page.goto(targetUrl);

  // Wait until the user closes the browser window
  await page.waitForEvent('close', { timeout: 300_000 }).catch(() => {});

  await context.storageState({ path: sessionPath });
  console.log(`Session saved → ${sessionPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
