import { test, expect } from '../../fixtures/pages.fixture.js';
import { adminCredentials } from '../../config/credentials.js';
import { buildNewBooking } from '../../data/bookingFactory.js';

test('a created booking is retrievable by id and by room, then deletable', async ({
  apiClient,
}) => {
  await apiClient.login(adminCredentials.username, adminCredentials.password);
  const booking = buildNewBooking({ roomid: 1 });

  const created = await apiClient.createBooking(booking);

  try {
    expect(created.firstname).toBe(booking.firstname);

    const fetched = await apiClient.getBooking(created.bookingid);
    expect(fetched).toEqual(created);

    const roomBookings = await apiClient.listBookingsForRoom(1);
    expect(roomBookings.map((b) => b.bookingid)).toContain(created.bookingid);
  } finally {
    await apiClient.deleteBooking(created.bookingid);
  }
});
