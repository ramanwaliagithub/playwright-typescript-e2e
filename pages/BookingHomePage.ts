import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

export class BookingHomePage extends BasePage {
  private readonly roomCards: Locator = this.page.locator('.room-card');
  private readonly checkinInput: Locator = this.page
    .locator('.dateWrapper')
    .nth(0)
    .locator('input');
  private readonly checkoutInput: Locator = this.page
    .locator('.dateWrapper')
    .nth(1)
    .locator('input');
  private readonly checkAvailabilityButton: Locator = this.page.getByRole('button', {
    name: 'Check Availability',
  });

  async open(): Promise<void> {
    await this.goto('/');
  }

  /** Defaults to a randomized future date, so repeated runs don't collide with dates a
   * previous run already booked on this shared hosted instance. */
  async setStayDates(checkin: Date, checkout: Date): Promise<void> {
    await this.checkinInput.fill(formatDate(checkin));
    await this.checkoutInput.fill(formatDate(checkout));
    await this.page.keyboard.press('Escape');
  }

  async checkAvailability(): Promise<void> {
    await this.checkAvailabilityButton.click();
  }

  private roomCardByType(roomType: string): Locator {
    return this.roomCards.filter({
      has: this.page.getByRole('heading', { name: roomType, exact: true }),
    });
  }

  priceFor(roomType: string): Locator {
    return this.roomCardByType(roomType).locator('.fw-bold.fs-5');
  }

  async bookRoom(roomType: string): Promise<void> {
    await this.roomCardByType(roomType).getByRole('link', { name: 'Book now' }).click();
  }
}
