import { test, expect } from '../../fixtures/pages.fixture.js';
import { adminCredentials } from '../../config/credentials.js';
import { uniqueSuffix } from '../../utils/uniqueSuffix.js';
import { buildNewMessage } from '../../data/messageFactory.js';

test('a submitted message is retrievable with the correct content', async ({ apiClient }) => {
  const subject = `API contract test ${uniqueSuffix()}`;
  const message = buildNewMessage({ subject });

  await apiClient.sendMessage(message);

  const messages = await apiClient.listMessages();
  const created = messages.find((m) => m.subject === subject);
  expect(created, 'newly sent message should appear in the message list').toBeDefined();

  const detail = await apiClient.getMessage(created!.id);
  try {
    expect(detail).toMatchObject({ ...message });
  } finally {
    await apiClient.login(adminCredentials.username, adminCredentials.password);
    await apiClient.deleteMessage(detail.messageid);
  }
});
