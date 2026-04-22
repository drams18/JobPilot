import { chromium } from 'playwright';
import { resolve } from 'path';
import type { AutomateArgs, AutomationEvent } from './types';
import { tryFillField, uploadCV, withRetry, FIELDS, sleep, randomDelay } from './selectors';

// Ordered step sequence — must match STEP_SEQUENCE in application-state.ts
const STEP_SEQUENCE = [
  'starting_automation',
  'navigating_to_url',
  'page_loaded',
  'name_filled',
  'email_filled',
  'phone_filled',
  'cover_letter_inserted',
  'upload_done',
  'ready_for_review',
  'submitting',
  'submitted',
];

function getStepIndex(step: string): number {
  return STEP_SEQUENCE.indexOf(step);
}

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
    resumeFrom: get('resumeFrom'),
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
  const resumeIndex = args.resumeFrom ? getStepIndex(args.resumeFrom) : -1;

  const shouldSkip = (step: string): boolean => {
    const idx = getStepIndex(step);
    return idx !== -1 && idx <= resumeIndex;
  };

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
    // ── INIT ──────────────────────────────────────────────────────────────
    if (shouldSkip('starting_automation')) {
      emit({ event: 'starting_automation', data: { skipped: true } });
    } else {
      emit({ event: 'starting_automation' });
    }

    if (shouldSkip('navigating_to_url')) {
      emit({ event: 'navigating_to_url', data: { url: args.url, skipped: true } });
    } else {
      emit({ event: 'navigating_to_url', data: { url: args.url } });
      await page.goto(args.url, { waitUntil: 'networkidle', timeout: 30_000 });
    }

    if (shouldSkip('page_loaded')) {
      emit({ event: 'page_loaded', data: { skipped: true } });
    } else {
      emit({ event: 'page_loaded' });
      await randomDelay();
    }

    // ── FIELDS ────────────────────────────────────────────────────────────
    // Name
    if (shouldSkip('name_filled')) {
      emit({ event: 'filling_name', data: { skipped: true } });
      emit({ event: 'name_filled', data: { success: true, skipped: true } });
    } else if (args.name) {
      emit({ event: 'filling_name' });
      const success = await withRetry(() => tryFillField(page, args.name, FIELDS.name), 2, 1500);
      emit({ event: 'name_filled', data: { success } });
      await randomDelay();
    }

    // Email
    if (shouldSkip('email_filled')) {
      emit({ event: 'filling_email', data: { skipped: true } });
      emit({ event: 'email_filled', data: { success: true, skipped: true } });
    } else {
      emit({ event: 'filling_email' });
      const success = await withRetry(() => tryFillField(page, args.email, FIELDS.email), 2, 1500);
      emit({ event: 'email_filled', data: { success } });
      await randomDelay();
    }

    // Phone
    if (shouldSkip('phone_filled')) {
      emit({ event: 'filling_phone', data: { skipped: true } });
      emit({ event: 'phone_filled', data: { success: true, skipped: true } });
    } else if (args.phone) {
      emit({ event: 'filling_phone' });
      const success = await withRetry(() => tryFillField(page, args.phone!, FIELDS.phone), 2, 1500);
      emit({ event: 'phone_filled', data: { success } });
      await randomDelay();
    }

    // Cover letter / message
    if (shouldSkip('cover_letter_inserted')) {
      emit({ event: 'filling_message', data: { skipped: true } });
      emit({ event: 'cover_letter_inserted', data: { success: true, skipped: true } });
    } else if (args.message) {
      emit({ event: 'filling_message' });
      const success = await withRetry(
        () => tryFillField(page, args.message, FIELDS.message),
        2,
        1500,
      );
      emit({ event: 'cover_letter_inserted', data: { success } });
      await randomDelay();
    }

    // ── CV UPLOAD ─────────────────────────────────────────────────────────
    if (shouldSkip('upload_done')) {
      emit({ event: 'selecting_cv', data: { skipped: true } });
      emit({ event: 'uploading_cv', data: { skipped: true } });
      emit({ event: 'upload_done', data: { success: true, skipped: true } });
    } else {
      emit({ event: 'selecting_cv' });
      await sleep(300);
      emit({ event: 'uploading_cv' });
      const uploadSuccess = await withRetry(() => uploadCV(page, args.cvPath), 2, 2000);
      emit({ event: 'upload_done', data: { success: uploadSuccess } });
      await sleep(500 + Math.random() * 500);
    }

    // ── HUMAN REVIEW ──────────────────────────────────────────────────────
    emit({ event: 'ready_for_review' });

    heartbeatInterval = setInterval(() => {
      emit({ event: 'heartbeat' });
    }, 7000);

    await Promise.race([
      page
        .waitForNavigation({ timeout: 600_000, waitUntil: 'domcontentloaded' })
        .then(() => {
          emit({ event: 'submitting' });
          emit({ event: 'submitted' });
        }),
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
