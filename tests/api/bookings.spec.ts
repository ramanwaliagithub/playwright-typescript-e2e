import { test, expect } from '../../fixtures/pages.fixture.js';
import { adminCredentials } from '../../config/credentials.js';
import { randomStayDates, toISODate } from '../../utils/randomStayDates.js';

test('a created booking is retrievable by id and by room, then deletable', async ({
  apiClient,
}) => {
  await apiClient.login(adminCredentials.username, adminCredentials.password);
  const { checkin, checkout } = randomStayDates();

  const created = await apiClient.createBooking({
    roomid: 1,
    firstname: 'Api',
    lastname: 'ContractTest',
    depositpaid: true,
    bookingdates: { checkin: toISODate(checkin), checkout: toISODate(checkout) },
  });

  try {
    expect(created.firstname).toBe('Api');

    const fetched = await apiClient.getBooking(created.bookingid);
    expect(fetched).toEqual(created);

    const roomBookings = await apiClient.listBookingsForRoom(1);
    expect(roomBookings.map((booking) => booking.bookingid)).toContain(created.bookingid);
  } finally {
    await apiClient.deleteBooking(created.bookingid);
  }
});
