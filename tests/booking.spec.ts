import { test, expect } from '../fixtures/pages.fixture.js';
import { randomStayDates } from '../utils/randomStayDates.js';

test('a guest can search, select, and book a room', async ({
  bookingHomePage,
  reservationPage,
}) => {
  const { checkin, checkout } = randomStayDates();

  await bookingHomePage.open();
  await bookingHomePage.setStayDates(checkin, checkout);
  await bookingHomePage.checkAvailability();
  await bookingHomePage.bookRoom('Single');

  await reservationPage.startReservation();
  await reservationPage.fillGuestDetails({
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '01234567890',
  });
  await reservationPage.confirmReservation();

  await expect(reservationPage.confirmationHeading).toBeVisible();
});
