import { faker } from '@faker-js/faker';
import type { NewMessage } from '../api/RbpApiClient.js';
import { buildGuest } from './guestFactory.js';

export function buildNewMessage(overrides: Partial<NewMessage> = {}): NewMessage {
  const guest = buildGuest();
  return {
    name: overrides.name ?? `${guest.firstName} ${guest.lastName}`,
    email: overrides.email ?? guest.email,
    phone: overrides.phone ?? guest.phone,
    subject: overrides.subject ?? faker.lorem.sentence({ min: 3, max: 6 }),
    description: overrides.description ?? faker.lorem.paragraph(),
  };
}
