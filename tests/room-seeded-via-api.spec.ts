import { test, expect } from '../fixtures/pages.fixture.js';
import { adminCredentials } from '../config/credentials.js';
import { buildNewRoom } from '../data/roomFactory.js';

test('a room created via the API appears in the admin rooms panel', async ({
  apiClient,
  adminLoginPage,
  adminRoomsPage,
}) => {
  await apiClient.login(adminCredentials.username, adminCredentials.password);

  const room = buildNewRoom();
  await apiClient.createRoom(room);

  try {
    await adminLoginPage.open();
    await adminLoginPage.login(adminCredentials.username, adminCredentials.password);
    await expect(adminRoomsPage.roomRow(room.roomName)).toBeVisible();
  } finally {
    const rooms = await apiClient.listRooms();
    const created = rooms.find((r) => r.roomName === room.roomName);
    expect(created, 'newly created room should appear in the room list').toBeDefined();
    await apiClient.deleteRoom(created!.roomid);
  }
});
