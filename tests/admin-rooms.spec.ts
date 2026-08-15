import { test, expect } from '../fixtures/pages.fixture.js';
import { adminCredentials } from '../config/credentials.js';
import { buildNewRoom } from '../data/roomFactory.js';

test('admin can create and delete a room', async ({ adminLoginPage, adminRoomsPage }) => {
  await adminLoginPage.open();
  await adminLoginPage.login(adminCredentials.username, adminCredentials.password);

  const room = buildNewRoom();

  await adminRoomsPage.createRoom({
    roomNumber: room.roomName,
    type: room.type,
    accessible: room.accessible,
    price: String(room.roomPrice),
    features: room.features,
  });

  try {
    await expect(adminRoomsPage.roomRow(room.roomName)).toBeVisible();
  } finally {
    await adminRoomsPage.deleteRoom(room.roomName);
  }
  await expect(adminRoomsPage.roomRow(room.roomName)).toBeHidden();
});
