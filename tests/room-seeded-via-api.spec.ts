import { test, expect } from '../fixtures/pages.fixture.js';
import { adminCredentials } from '../config/credentials.js';
import { uniqueSuffix } from '../utils/uniqueSuffix.js';

test('a room created via the API appears in the admin rooms panel', async ({
  apiClient,
  adminLoginPage,
  adminRoomsPage,
}) => {
  await apiClient.login(adminCredentials.username, adminCredentials.password);

  const roomName = uniqueSuffix();
  await apiClient.createRoom({
    roomName,
    type: 'Single',
    accessible: true,
    roomPrice: 88,
    features: ['WiFi'],
  });

  try {
    await adminLoginPage.open();
    await adminLoginPage.login(adminCredentials.username, adminCredentials.password);
    await expect(adminRoomsPage.roomRow(roomName)).toBeVisible();
  } finally {
    const rooms = await apiClient.listRooms();
    const created = rooms.find((room) => room.roomName === roomName);
    expect(created, 'newly created room should appear in the room list').toBeDefined();
    await apiClient.deleteRoom(created!.roomid);
  }
});
