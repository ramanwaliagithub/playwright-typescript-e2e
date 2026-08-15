import { faker } from '@faker-js/faker';
import type { NewBooking } from '../api/RbpApiClient.js';
import { buildGuest } from './guestFactory.js';
import { randomStayDates, toISODate } from '../utils/randomStayDates.js';

export function buildNewBooking(overrides: Partial<NewBooking> = {}): NewBooking {
  const guest = buildGuest();
  const { checkin, checkout } = randomStayDates();
  return {
    roomid: overrides.roomid ?? 1,
    firstname: overrides.firstname ?? guest.firstName,
    lastname: overrides.lastname ?? guest.lastName,
    depositpaid: overrides.depositpaid ?? faker.datatype.boolean(),
    bookingdates: overrides.bookingdates ?? {
      checkin: toISODate(checkin),
      checkout: toISODate(checkout),
    },
  };
}
