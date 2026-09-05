import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { SelfHealingLocator } from '../utils/SelfHealingLocator.js';

export class AdminLoginPage extends BasePage {
  private readonly usernameInput: Locator = this.page.locator('#username');
  private readonly passwordInput: Locator = this.page.locator('#password');
  private readonly loginButton = new SelfHealingLocator(
    this.page.locator('#doLogin'),
    this.page.getByRole('button', { name: /log ?in/i }),
    'admin login button',
  );

  async open(): Promise<void> {
    await this.goto('/admin');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('**/admin/rooms');
  }
}
