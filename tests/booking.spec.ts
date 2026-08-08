import { test, expect } from '../fixtures/pages.fixture.js';

test('a guest can search, select, and book a room', async ({
  bookingHomePage,
  reservationPage,
}) => {
  // Pick a random date far enough out that it's very unlikely another test run (or another
  // learner, on this shared hosted instance) has already booked every room for that day.
  const daysOut = 30 + Math.floor(Math.random() * 300);
  const checkin = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
  const checkout = new Date(checkin.getTime() + 24 * 60 * 60 * 1000);

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
