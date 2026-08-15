import { faker } from '@faker-js/faker';

export interface Guest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function buildGuest(overrides: Partial<Guest> = {}): Guest {
  const firstName = overrides.firstName ?? faker.person.firstName();
  const lastName = overrides.lastName ?? faker.person.lastName();
  const email = overrides.email ?? faker.internet.email({ firstName, lastName });
  const phone = overrides.phone ?? faker.phone.number();
  return { firstName, lastName, email, phone };
}
