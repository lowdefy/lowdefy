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

const mockSendMail = jest.fn();
const mockClose = jest.fn();
const mockCreateTransport = jest.fn();

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

beforeEach(() => {
  mockCreateTransport.mockImplementation(() => ({
    sendMail: mockSendMail,
    close: mockClose,
  }));
  mockSendMail.mockResolvedValue({
    messageId: '<message-id@example.com>',
    accepted: ['someone@example.com'],
    rejected: [],
  });
});

test('send creates a transport with connection options excluding from, replyTo and filter', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'user', pass: 'pass' },
    pool: true,
    from: 'from@example.com',
    replyTo: 'reply@example.com',
    filter: null,
  };
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
    text: 'B',
  };
  await send({ connection, mail });
  expect(mockCreateTransport.mock.calls).toEqual([
    [
      {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'user', pass: 'pass' },
        pool: true,
      },
    ],
  ]);
});

test('send passes mail fields and connection from to sendMail', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
  };
  const mail = {
    to: 'someone@example.com',
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    subject: 'A',
    text: 'B',
    html: '<p>B</p>',
    attachments: [{ filename: 'a.txt', content: 'aaa' }],
  };
  await send({ connection, mail });
  expect(mockSendMail.mock.calls).toEqual([
    [
      {
        from: 'from@example.com',
        to: 'someone@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        replyTo: undefined,
        subject: 'A',
        text: 'B',
        html: '<p>B</p>',
        attachments: [{ filename: 'a.txt', content: 'aaa' }],
      },
    ],
  ]);
});

test('send uses connection replyTo when mail has no replyTo', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
    replyTo: 'reply@example.com',
  };
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
  };
  await send({ connection, mail });
  expect(mockSendMail.mock.calls[0][0].replyTo).toEqual('reply@example.com');
});

test('send mail replyTo overrides connection replyTo', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
    replyTo: 'reply@example.com',
  };
  const mail = {
    to: 'someone@example.com',
    replyTo: 'mail-reply@example.com',
    subject: 'A',
  };
  await send({ connection, mail });
  expect(mockSendMail.mock.calls[0][0].replyTo).toEqual('mail-reply@example.com');
});

test('send returns messageId, accepted and rejected from transport info', async () => {
  const send = (await import('./send.js')).default;
  mockSendMail.mockResolvedValue({
    messageId: '<id@example.com>',
    accepted: ['someone@example.com'],
    rejected: ['rejected@example.com'],
    response: '250 OK',
  });
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
  };
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
  };
  const result = await send({ connection, mail });
  expect(result).toEqual({
    messageId: '<id@example.com>',
    accepted: ['someone@example.com'],
    rejected: ['rejected@example.com'],
  });
});

test('send returns filtered result without creating a transport when mail is filtered out', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
    filter: { allowlist: ['example.com'] },
  };
  const mail = {
    to: 'blocked@blocked.org',
    subject: 'A',
  };
  const result = await send({ connection, mail });
  expect(result).toEqual({ messageId: null, filtered: true });
  expect(mockCreateTransport).not.toHaveBeenCalled();
  expect(mockSendMail).not.toHaveBeenCalled();
});

test('send applies the connection filter to mail recipients', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
    filter: { allowlist: ['example.com'] },
  };
  const mail = {
    to: ['someone@example.com', 'blocked@blocked.org'],
    subject: 'A',
  };
  await send({ connection, mail });
  expect(mockSendMail.mock.calls[0][0].to).toEqual(['someone@example.com']);
});

test('send closes the transport after a successful send', async () => {
  const send = (await import('./send.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
  };
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
  };
  await send({ connection, mail });
  expect(mockClose).toHaveBeenCalledTimes(1);
});

test('send closes the transport and rethrows when sendMail rejects', async () => {
  const send = (await import('./send.js')).default;
  mockSendMail.mockRejectedValue(new Error('Connection refused.'));
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
  };
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
  };
  await expect(send({ connection, mail })).rejects.toThrow('Connection refused.');
  expect(mockClose).toHaveBeenCalledTimes(1);
});
