import { test, expect } from '../fixtures/pages.fixture.js';

const ADMIN_USERNAME = process.env['ADMIN_USERNAME'] ?? 'admin';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'password';

test('admin can create and delete a room', async ({ adminLoginPage, adminRoomsPage }) => {
  await adminLoginPage.open();
  await adminLoginPage.login(ADMIN_USERNAME, ADMIN_PASSWORD);

  // Unique per run so parallel/concurrent runs against the shared hosted instance don't collide.
  const roomNumber = `9${Date.now() % 100_000}`;

  await adminRoomsPage.createRoom({
    roomNumber,
    type: 'Single',
    accessible: true,
    price: '99',
    features: ['WiFi'],
  });
  await expect(adminRoomsPage.roomRow(roomNumber)).toBeVisible();

  await adminRoomsPage.deleteRoom(roomNumber);
  await expect(adminRoomsPage.roomRow(roomNumber)).toBeHidden();
});
