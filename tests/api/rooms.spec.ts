import { test, expect } from '../../fixtures/pages.fixture.js';

test('GET /api/room returns the seeded rooms with a valid schema', async ({ apiClient }) => {
  const rooms = await apiClient.listRooms();

  const roomNames = rooms.map((room) => room.roomName);
  expect(roomNames).toEqual(expect.arrayContaining(['101', '102', '103']));
});
