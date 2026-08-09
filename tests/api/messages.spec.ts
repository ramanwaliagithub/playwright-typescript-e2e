import { test, expect } from '../../fixtures/pages.fixture.js';
import { adminCredentials } from '../../config/credentials.js';
import { uniqueSuffix } from '../../utils/uniqueSuffix.js';

test('a submitted message is retrievable with the correct content', async ({ apiClient }) => {
  const subject = `API contract test ${uniqueSuffix()}`;

  await apiClient.sendMessage({
    name: 'Api Test',
    email: 'api.test@example.com',
    phone: '01234567890',
    subject,
    description: 'Hello from the API test layer',
  });

  const messages = await apiClient.listMessages();
  const created = messages.find((message) => message.subject === subject);
  expect(created, 'newly sent message should appear in the message list').toBeDefined();

  const detail = await apiClient.getMessage(created!.id);
  try {
    expect(detail).toMatchObject({
      name: 'Api Test',
      email: 'api.test@example.com',
      phone: '01234567890',
      subject,
      description: 'Hello from the API test layer',
    });
  } finally {
    await apiClient.login(adminCredentials.username, adminCredentials.password);
    await apiClient.deleteMessage(detail.messageid);
  }
});
