/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { vi, beforeEach, expect, test } from 'vitest';
import { ConfigError, ServiceError } from '@lowdefy/errors';

vi.doMock('@lowdefy/connection-smtp/send', () => ({
  default: vi.fn(async () => ({ messageId: 'test-message-id' })),
}));

vi.doMock('../connections/getConnectionConfig.js', () => ({
  default: vi.fn(),
}));

const { default: createSendEmail } = await import('./createSendEmail.js');
const { default: send } = await import('@lowdefy/connection-smtp/send');
const { default: getConnectionConfig } = await import('../connections/getConnectionConfig.js');

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const connectionProperties = {
  from: 'auth@example.com',
  filter: { allow: ['*@example.com'] },
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user', pass: 'pass' },
};

const authEmailConfig = { connectionId: 'email', '~k': 'auth_email_key' };

function makeContext() {
  return {
    logger,
    readConfigFile: vi.fn(),
    evaluateOperators: vi.fn(() => connectionProperties),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('resolves the connection by connectionId and sends the mail with resolved connection', async () => {
  const context = makeContext();
  const connectionConfig = {
    id: 'connection:email',
    type: 'SMTP',
    properties: { from: '_secret: EMAIL_FROM' },
  };
  getConnectionConfig.mockResolvedValueOnce(connectionConfig);

  const sendEmail = createSendEmail({ authEmailConfig });
  const result = await sendEmail({
    to: 'user@example.com',
    subject: 'Verify your email',
    html: '<p>Verify</p>',
    text: 'Verify',
    context,
  });

  expect(getConnectionConfig).toHaveBeenCalledWith(context, { connectionId: 'email' });
  expect(context.evaluateOperators).toHaveBeenCalledWith({
    input: connectionConfig.properties,
    location: 'email',
  });
  expect(send).toHaveBeenCalledWith({
    connection: connectionProperties,
    mail: {
      to: 'user@example.com',
      subject: 'Verify your email',
      html: '<p>Verify</p>',
      text: 'Verify',
    },
  });
  expect(result).toEqual({ messageId: 'test-message-id' });
});

test('evaluates empty properties when the connection has none', async () => {
  const context = makeContext();
  getConnectionConfig.mockResolvedValueOnce({ id: 'connection:email', type: 'SMTP' });

  const sendEmail = createSendEmail({ authEmailConfig });
  await sendEmail({ to: 'user@example.com', subject: 's', html: 'h', text: 't', context });

  expect(context.evaluateOperators).toHaveBeenCalledWith({ input: {}, location: 'email' });
});

test('returns the filtered result without throwing when a recipient is filtered out', async () => {
  const context = makeContext();
  getConnectionConfig.mockResolvedValueOnce({ properties: {} });
  send.mockResolvedValueOnce({ messageId: null, filtered: true });

  const sendEmail = createSendEmail({ authEmailConfig });
  const result = await sendEmail({
    to: 'blocked@other.com',
    subject: 's',
    html: 'h',
    text: 't',
    context,
  });

  expect(result).toEqual({ messageId: null, filtered: true });
});

test('throws a ServiceError with service SMTP when send fails', async () => {
  const context = makeContext();
  getConnectionConfig.mockResolvedValueOnce({ properties: {} });
  const sendError = new Error('Connection refused');
  send.mockRejectedValueOnce(sendError);

  const sendEmail = createSendEmail({ authEmailConfig });
  let thrown;
  try {
    await sendEmail({ to: 'user@example.com', subject: 's', html: 'h', text: 't', context });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ServiceError);
  expect(thrown.service).toBe('SMTP');
  expect(thrown.configKey).toBe('auth_email_key');
  expect(thrown.cause).toBe(sendError);
});

test('wraps a non-service send failure in a ConfigError naming the connection, not the recipient', async () => {
  const context = makeContext();
  getConnectionConfig.mockResolvedValueOnce({ properties: {} });
  const sendError = new Error(
    "Can't send mail - all recipients were rejected: 550 <user@example.com>"
  );
  sendError.code = 'EENVELOPE';
  sendError.rejected = ['user@example.com'];
  send.mockRejectedValueOnce(sendError);

  const sendEmail = createSendEmail({ authEmailConfig });
  let thrown;
  try {
    await sendEmail({ to: 'user@example.com', subject: 's', html: 'h', text: 't', context });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toBe(
    'Auth email could not be sent through connection "email" (EENVELOPE). Check the SMTP connection auth.email.connectionId names.'
  );
  expect(thrown.configKey).toBe('auth_email_key');
  expect(thrown.cause).toBe(sendError);
  expect(thrown.message).not.toContain('user@example.com');
});
