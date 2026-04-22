import type { Page } from 'playwright';
import type { FieldHints } from './types';

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const randomDelay = () => sleep(300 + Math.random() * 700);

export const FIELDS: Record<string, FieldHints> = {
  name: {
    labels: ['nom', 'name', 'prénom', 'prenom', 'full name', 'nom complet', 'votre nom'],
    ariaLabels: ['nom', 'name', 'prénom'],
    placeholders: ['nom', 'name', 'votre nom', 'prénom'],
    cssSelectors: [
      'input[name="name"]',
      'input[name="fullName"]',
      'input[name="full_name"]',
      'input[name="firstName"]',
      'input[name="lastName"]',
      'input[id*="name" i]',
    ],
  },
  email: {
    labels: ['email', 'e-mail', 'adresse mail', 'adresse email', 'votre email'],
    ariaLabels: ['email', 'e-mail', 'adresse mail'],
    placeholders: ['email', 'e-mail', 'mail', 'votre email'],
    cssSelectors: ['input[type="email"]', 'input[name="email"]', 'input[id*="email" i]'],
  },
  phone: {
    labels: ['téléphone', 'telephone', 'phone', 'mobile', 'numéro', 'numero'],
    ariaLabels: ['téléphone', 'telephone', 'phone', 'mobile'],
    placeholders: ['téléphone', 'telephone', 'phone', '06', '07', '+33'],
    cssSelectors: [
      'input[type="tel"]',
      'input[name="phone"]',
      'input[name="telephone"]',
      'input[name="mobile"]',
      'input[id*="phone" i]',
      'input[id*="tel" i]',
    ],
  },
  message: {
    labels: [
      'message',
      'lettre',
      'motivation',
      'cover letter',
      'lettre de motivation',
      'présentation',
      'presentation',
    ],
    ariaLabels: ['lettre', 'message', 'motivation', 'cover letter'],
    placeholders: ['motivation', 'lettre', 'message', 'cover', 'présentez-vous'],
    cssSelectors: [
      'textarea[name="message"]',
      'textarea[name="coverLetter"]',
      'textarea[name="cover_letter"]',
      'textarea[name="motivation"]',
      'textarea[id*="message" i]',
      'textarea[id*="letter" i]',
      'textarea',
    ],
  },
};

export async function tryFillField(
  page: Page,
  value: string,
  hints: FieldHints,
): Promise<boolean> {
  // Level 1: getByLabel — most reliable for accessible forms
  for (const label of hints.labels ?? []) {
    try {
      const el = page.getByLabel(label, { exact: false });
      if (await el.isVisible({ timeout: 1000 })) {
        await el.fill(value);
        return true;
      }
    } catch {
      // next
    }
  }

  // Level 2: aria-label attribute
  for (const label of hints.ariaLabels ?? []) {
    try {
      const el = page.locator(`[aria-label*="${label}" i]`).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.fill(value);
        return true;
      }
    } catch {
      // next
    }
  }

  // Level 3: placeholder text
  for (const ph of hints.placeholders ?? []) {
    try {
      const el = page
        .locator(`input[placeholder*="${ph}" i], textarea[placeholder*="${ph}" i]`)
        .first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.fill(value);
        return true;
      }
    } catch {
      // next
    }
  }

  // Level 4: CSS attribute fallback
  for (const sel of hints.cssSelectors ?? []) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.fill(value);
        return true;
      }
    } catch {
      // next
    }
  }

  return false;
}

export async function uploadCV(page: Page, filePath: string): Promise<boolean> {
  const selectors = [
    'input[type="file"][accept*="pdf"]',
    'input[type="file"][name*="cv" i]',
    'input[type="file"][name*="resume" i]',
    'input[type="file"][id*="cv" i]',
    'input[type="file"][id*="resume" i]',
    'input[type="file"]',
  ];

  for (const sel of selectors) {
    try {
      const input = page.locator(sel).first();
      if ((await input.count()) > 0) {
        // Make hidden inputs visible so Playwright can interact
        await input.evaluate((el) => {
          const e = el as HTMLInputElement;
          e.style.display = 'block';
          e.style.opacity = '1';
          e.style.visibility = 'visible';
          e.removeAttribute('hidden');
        });
        await input.setInputFiles(filePath);
        return true;
      }
    } catch {
      // next
    }
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1500,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      await sleep(delay);
      return withRetry(fn, retries - 1, delay);
    }
    throw err;
  }
}
