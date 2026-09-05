import type { Locator } from '@playwright/test';
import { test } from '@playwright/test';

const FALLBACK_WAIT_MS = 2000;

/**
 * Wraps a primary locator with a fallback: if the primary hasn't attached within
 * FALLBACK_WAIT_MS, falls back to a secondary locator strategy instead of failing outright, and
 * attaches a note to the running test so a primary selector quietly degrading stays visible in
 * reports instead of only showing up once it breaks completely.
 */
export class SelfHealingLocator {
  constructor(
    private readonly primary: Locator,
    private readonly fallback: Locator,
    private readonly description: string,
  ) {}

  private async resolve(): Promise<Locator> {
    try {
      await this.primary.waitFor({ state: 'attached', timeout: FALLBACK_WAIT_MS });
      return this.primary;
    } catch {
      await test.info().attach(`self-healing fallback used: ${this.description}`, {
        body: `Primary locator for "${this.description}" did not attach within ${FALLBACK_WAIT_MS}ms; used the fallback locator instead.`,
        contentType: 'text/plain',
      });
      return this.fallback;
    }
  }

  async click(): Promise<void> {
    await (await this.resolve()).click();
  }

  async fill(value: string): Promise<void> {
    await (await this.resolve()).fill(value);
  }
}
