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

import { jest } from '@jest/globals';

const mockSend = jest.fn();
const mockSetApiKey = jest.fn();

jest.unstable_mockModule('@sendgrid/mail', () => {
  return {
    default: {
      setApiKey: mockSetApiKey,
      send: mockSend,
    },
  };
});

afterEach(() => {
  jest.resetAllMocks();
});

test('send sets the api key and returns the messageId from response headers', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'message-id-1' } }]);
  const result = await send({
    connection: { apiKey: 'X', from: 'from@x.com' },
    mail: { to: 'a@b.com', subject: 'A', text: 'B' },
  });
  expect(mockSetApiKey.mock.calls).toEqual([['X']]);
  expect(mockSend.mock.calls).toEqual([
    [
      {
        to: 'a@b.com',
        subject: 'A',
        text: 'B',
        from: 'from@x.com',
        replyTo: undefined,
        templateId: undefined,
        mailSettings: undefined,
      },
    ],
  ]);
  expect(result).toEqual({ messageId: 'message-id-1', to: 'a@b.com' });
});

test('send returns messageId null when response has no message id header', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{}]);
  const result = await send({
    connection: { apiKey: 'X', from: 'from@x.com' },
    mail: { to: 'a@b.com' },
  });
  expect(result).toEqual({ messageId: null, to: 'a@b.com' });
});

test('send applies the connection filter to the mail', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'message-id-1' } }]);
  const result = await send({
    connection: { apiKey: 'X', from: 'from@x.com', filter: { allowlist: ['allowed.com'] } },
    mail: { to: ['a@allowed.com', 'b@other.com'], cc: 'c@other.com', subject: 'A' },
  });
  expect(mockSend.mock.calls).toEqual([
    [
      {
        to: ['a@allowed.com'],
        cc: undefined,
        bcc: undefined,
        subject: 'A',
        from: 'from@x.com',
        replyTo: undefined,
        templateId: undefined,
        mailSettings: undefined,
      },
    ],
  ]);
  expect(result).toEqual({ messageId: 'message-id-1', to: ['a@allowed.com'] });
});

test('send returns the replaced address when the filter redirects mail', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'message-id-1' } }]);
  const result = await send({
    connection: { apiKey: 'X', from: 'from@x.com', filter: { replaceAddress: 'dev@test.com' } },
    mail: { to: 'a@b.com', subject: 'A' },
  });
  expect(mockSend.mock.calls[0][0].to).toEqual('dev@test.com');
  expect(result).toEqual({ messageId: 'message-id-1', to: 'dev@test.com' });
});

test('send returns filtered result without calling sendgrid when no to recipients survive', async () => {
  const send = (await import('./send.js')).default;
  const result = await send({
    connection: { apiKey: 'X', from: 'from@x.com', filter: { allowlist: ['allowed.com'] } },
    mail: { to: 'a@other.com', subject: 'A' },
  });
  expect(result).toEqual({ messageId: null, to: null, filtered: true });
  expect(mockSend).not.toHaveBeenCalled();
});

test('send uses connection replyTo as default and mail replyTo as override', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'message-id-1' } }]);
  await send({
    connection: { apiKey: 'X', from: 'from@x.com', replyTo: 'reply@x.com' },
    mail: { to: 'a@b.com' },
  });
  await send({
    connection: { apiKey: 'X', from: 'from@x.com', replyTo: 'reply@x.com' },
    mail: { to: 'a@b.com', replyTo: 'other@x.com' },
  });
  expect(mockSend.mock.calls[0][0].replyTo).toEqual('reply@x.com');
  expect(mockSend.mock.calls[1][0].replyTo).toEqual('other@x.com');
});

test('send does not clobber the mail templateId when connection templateId is undefined', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'message-id-1' } }]);
  await send({
    connection: { apiKey: 'X', from: 'from@x.com' },
    mail: { to: 'a@b.com', templateId: 'mail-template' },
  });
  await send({
    connection: { apiKey: 'X', from: 'from@x.com', templateId: 'connection-template' },
    mail: { to: 'a@b.com', templateId: 'mail-template' },
  });
  expect(mockSend.mock.calls[0][0].templateId).toEqual('mail-template');
  expect(mockSend.mock.calls[1][0].templateId).toEqual('connection-template');
});

test('send passes connection mailSettings to sendgrid', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockResolvedValue([{ headers: { 'x-message-id': 'message-id-1' } }]);
  await send({
    connection: {
      apiKey: 'X',
      from: 'from@x.com',
      mailSettings: { sandboxMode: { enable: true } },
    },
    mail: { to: 'a@b.com' },
  });
  expect(mockSend.mock.calls[0][0].mailSettings).toEqual({ sandboxMode: { enable: true } });
});

test('send wraps errors with a response in a SendGrid request failed error', async () => {
  const send = (await import('./send.js')).default;
  const error = new Error('Test error.');
  error.response = { body: ['Test error 1.'] };
  mockSend.mockRejectedValue(error);
  await expect(
    send({ connection: { apiKey: 'X', from: 'from@x.com' }, mail: { to: 'a@b.com' } })
  ).rejects.toThrow('SendGrid request failed.');
});

test('send rethrows errors without a response unchanged', async () => {
  const send = (await import('./send.js')).default;
  mockSend.mockRejectedValue(new Error('Test error.'));
  await expect(
    send({ connection: { apiKey: 'X', from: 'from@x.com' }, mail: { to: 'a@b.com' } })
  ).rejects.toThrow('Test error.');
});
