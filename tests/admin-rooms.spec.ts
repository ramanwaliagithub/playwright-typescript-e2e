import { test, expect } from '../fixtures/pages.fixture.js';
import { adminCredentials } from '../config/credentials.js';
import { uniqueSuffix } from '../utils/uniqueSuffix.js';

test('admin can create and delete a room', async ({ adminLoginPage, adminRoomsPage }) => {
  await adminLoginPage.open();
  await adminLoginPage.login(adminCredentials.username, adminCredentials.password);

  const roomNumber = uniqueSuffix();

  await adminRoomsPage.createRoom({
    roomNumber,
    type: 'Single',
    accessible: true,
    price: '99',
    features: ['WiFi'],
  });

  try {
    await expect(adminRoomsPage.roomRow(roomNumber)).toBeVisible();
  } finally {
    await adminRoomsPage.deleteRoom(roomNumber);
  }
  await expect(adminRoomsPage.roomRow(roomNumber)).toBeHidden();
});
