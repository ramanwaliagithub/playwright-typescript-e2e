import { test as base } from '@playwright/test';
import { BookingHomePage } from '../pages/BookingHomePage.js';
import { ReservationPage } from '../pages/ReservationPage.js';
import { AdminLoginPage } from '../pages/AdminLoginPage.js';
import { AdminRoomsPage } from '../pages/AdminRoomsPage.js';

interface PageFixtures {
  bookingHomePage: BookingHomePage;
  reservationPage: ReservationPage;
  adminLoginPage: AdminLoginPage;
  adminRoomsPage: AdminRoomsPage;
}

export const test = base.extend<PageFixtures>({
  bookingHomePage: async ({ page }, use) => {
    await use(new BookingHomePage(page));
  },
  reservationPage: async ({ page }, use) => {
    await use(new ReservationPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  adminRoomsPage: async ({ page }, use) => {
    await use(new AdminRoomsPage(page));
  },
});

export { expect } from '@playwright/test';
