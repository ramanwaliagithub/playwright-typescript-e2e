import type { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
