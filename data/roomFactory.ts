import { faker } from '@faker-js/faker';
import type { NewRoom, RoomType, RoomFeature } from '../api/RbpApiClient.js';
import { uniqueSuffix } from '../utils/uniqueSuffix.js';

const roomTypes: RoomType[] = ['Single', 'Twin', 'Double', 'Family', 'Suite'];
const roomFeatures: RoomFeature[] = ['WiFi', 'TV', 'Radio', 'Refreshments', 'Safe', 'Views'];

export function buildNewRoom(overrides: Partial<NewRoom> = {}) {
  return {
    roomName: overrides.roomName ?? uniqueSuffix(),
    type: overrides.type ?? faker.helpers.arrayElement(roomTypes),
    accessible: overrides.accessible ?? faker.datatype.boolean(),
    roomPrice: overrides.roomPrice ?? faker.number.int({ min: 50, max: 500 }),
    features: overrides.features ?? faker.helpers.arrayElements(roomFeatures, { min: 1, max: 3 }),
  } satisfies NewRoom;
}
