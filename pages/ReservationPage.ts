import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export class ReservationPage extends BasePage {
  private readonly bookingCard: Locator = this.page.locator('.booking-card');
  private readonly reserveNowButton: Locator = this.bookingCard.getByRole('button', {
    name: 'Reserve Now',
  });
  private readonly firstNameInput: Locator = this.bookingCard.locator('input[name="firstname"]');
  private readonly lastNameInput: Locator = this.bookingCard.locator('input[name="lastname"]');
  private readonly emailInput: Locator = this.bookingCard.locator('input[name="email"]');
  private readonly phoneInput: Locator = this.bookingCard.locator('input[name="phone"]');

  readonly confirmationHeading: Locator = this.bookingCard.getByRole('heading', {
    name: 'Booking Confirmed',
  });

  async startReservation(): Promise<void> {
    await this.reserveNowButton.click();
  }

  async fillGuestDetails(details: GuestDetails): Promise<void> {
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.phoneInput.fill(details.phone);
  }

  async confirmReservation(): Promise<void> {
    await this.reserveNowButton.click();
  }
}
