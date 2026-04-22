import { chromium } from 'playwright';
import { resolve } from 'path';
import type { AutomateArgs, AutomationEvent } from './types';
import { tryFillField, uploadCV, withRetry, FIELDS, sleep, randomDelay } from './selectors';

function parseArgs(): AutomateArgs {
  const args = process.argv.slice(2);

  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(`--${flag}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const required = (flag: string): string => {
    const v = get(flag);
    if (!v) {
      emit({ event: 'error', data: { message: `Missing required arg --${flag}` } });
      process.exit(1);
    }
    return v;
  };

  return {
    url: required('url'),
    name: required('name'),
    email: required('email'),
    phone: get('phone'),
    cvPath: required('cvPath'),
    message: required('message'),
    sessionPath: get('session') ?? resolve(__dirname, '../sessions/default.json'),
    headless: get('headless') === 'true',
  };
}

function emit(ev: AutomationEvent): void {
  process.stdout.write(JSON.stringify(ev) + '\n');
}

async function hasFile(path: string): Promise<boolean> {
  try {
    const { accessSync } = await import('fs');
    accessSync(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs();

  const sessionExists = await hasFile(args.sessionPath);

  const browser = await chromium.launch({
    headless: args.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    storageState: sessionExists ? args.sessionPath : undefined,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  try {
    emit({ event: 'navigating', data: { url: args.url } });

    await page.goto(args.url, { waitUntil: 'networkidle', timeout: 30_000 });
    emit({ event: 'page_loaded' });

    await randomDelay();

    // Fill each field with retry + delay between each
    const fields: Array<{ key: keyof typeof FIELDS; value: string | undefined }> = [
      { key: 'name', value: args.name },
      { key: 'email', value: args.email },
      { key: 'phone', value: args.phone },
      { key: 'message', value: args.message },
    ];

    for (const { key, value } of fields) {
      if (!value) continue;
      const success = await withRetry(
        () => tryFillField(page, value, FIELDS[key]),
        2,
        1500,
      );
      emit({ event: 'field_filled', data: { field: key, success } });
      await randomDelay();
    }

    // Upload CV
    const uploadSuccess = await withRetry(() => uploadCV(page, args.cvPath), 2, 2000);
    emit({ event: 'upload_done', data: { success: uploadSuccess } });

    await sleep(500 + Math.random() * 500);

    // Human review phase — user validates and submits
    emit({ event: 'ready_for_review' });

    heartbeatInterval = setInterval(() => {
      emit({ event: 'heartbeat' });
    }, 7000);

    await Promise.race([
      page
        .waitForNavigation({ timeout: 600_000, waitUntil: 'domcontentloaded' })
        .then(() => emit({ event: 'submitted' })),
      page
        .waitForEvent('close', { timeout: 600_000 })
        .then(() => emit({ event: 'cancelled' })),
    ]).catch(() => emit({ event: 'cancelled' }));
  } catch (err) {
    emit({ event: 'error', data: { message: (err as Error).message } });
  } finally {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    try {
      await context.storageState({ path: args.sessionPath });
    } catch {
      // session save is best-effort
    }

    await browser.close();
    emit({ event: 'process_exit', data: { code: 0 } });
  }
}

main().catch((err) => {
  emit({ event: 'error', data: { message: String(err) } });
  process.exit(1);
});
