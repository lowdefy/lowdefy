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
import { validate } from '@lowdefy/ajv';

const mockSend = jest.fn();

jest.unstable_mockModule('../send.js', () => ({
  default: mockSend,
}));

beforeEach(() => {
  mockSend.mockImplementation(({ mail }) => {
    return Promise.resolve({
      messageId: `<${mail.to}>`,
      accepted: [mail.to],
      rejected: [],
    });
  });
});

test('SMTPMailSend sends a single object request through send', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
  };
  const request = {
    to: 'someone@example.com',
    subject: 'A',
    text: 'B',
  };
  const result = await SMTPMailSend({ request, connection });
  expect(mockSend.mock.calls).toEqual([
    [
      {
        connection,
        mail: {
          to: 'someone@example.com',
          subject: 'A',
          text: 'B',
        },
      },
    ],
  ]);
  expect(result).toEqual({
    response: 'Mail sent successfully',
    results: [
      {
        messageId: '<someone@example.com>',
        accepted: ['someone@example.com'],
        rejected: [],
      },
    ],
  });
});

test('SMTPMailSend sends each message in an array request through send sequentially', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
  };
  const request = [
    {
      to: 'a@example.com',
      subject: 'A',
      text: 'A',
    },
    {
      to: 'b@example.com',
      subject: 'B',
      text: 'B',
    },
  ];
  const result = await SMTPMailSend({ request, connection });
  expect(mockSend.mock.calls).toEqual([
    [
      {
        connection,
        mail: {
          to: 'a@example.com',
          subject: 'A',
          text: 'A',
        },
      },
    ],
    [
      {
        connection,
        mail: {
          to: 'b@example.com',
          subject: 'B',
          text: 'B',
        },
      },
    ],
  ]);
  expect(result).toEqual({
    response: 'Mail sent successfully',
    results: [
      {
        messageId: '<a@example.com>',
        accepted: ['a@example.com'],
        rejected: [],
      },
      {
        messageId: '<b@example.com>',
        accepted: ['b@example.com'],
        rejected: [],
      },
    ],
  });
});

test('SMTPMailSend includes filtered results for filtered-out messages', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  mockSend.mockResolvedValue({ messageId: null, filtered: true });
  const connection = {
    host: 'smtp.example.com',
    from: 'from@example.com',
    filter: { allowlist: ['example.com'] },
  };
  const request = {
    to: 'blocked@blocked.org',
    subject: 'A',
  };
  const result = await SMTPMailSend({ request, connection });
  expect(result).toEqual({
    response: 'Mail sent successfully',
    results: [{ messageId: null, filtered: true }],
  });
});

test('SMTPMailSend schema validates a valid request', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const schema = SMTPMailSend.schema;
  const request = {
    to: ['someone@example.com', 'Name One <other@example.com>', { name: 'A', email: 'a@b.com' }],
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    replyTo: 'reply@example.com',
    subject: 'A',
    text: 'B',
    html: '<p>B</p>',
    attachments: [{ filename: 'a.txt', content: 'aaa', contentType: 'text/plain' }],
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('SMTPMailSend schema accepts null cc, bcc and replyTo', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const schema = SMTPMailSend.schema;
  // Operator-driven configs (e.g. `_if_none: [item.cc, null]`) resolve
  // absent optional address fields to null; the schema must treat that as omitted.
  const request = {
    to: 'someone@example.com',
    cc: null,
    bcc: null,
    replyTo: null,
    subject: 'A',
    text: 'B',
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('SMTPMailSend schema validates an array request', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const schema = SMTPMailSend.schema;
  const request = [
    { to: 'a@example.com', subject: 'A', text: 'A' },
    { to: 'b@example.com', subject: 'B', text: 'B' },
  ];
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('SMTPMailSend schema throws when request is missing to', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const schema = SMTPMailSend.schema;
  const request = {
    subject: 'A',
    text: 'B',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SMTPMailSend request properties should be an object or an array describing emails to send.'
  );
});

test('SMTPMailSend schema throws when subject is not a string', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  const schema = SMTPMailSend.schema;
  const request = {
    to: 'someone@example.com',
    subject: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SMTPMailSend request property "subject" should be a string.'
  );
});

test('SMTPMailSend meta checkRead should be false', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  expect(SMTPMailSend.meta.checkRead).toBe(false);
});

test('SMTPMailSend meta checkWrite should be false', async () => {
  const SMTPMailSend = (await import('./SMTPMailSend.js')).default;
  expect(SMTPMailSend.meta.checkWrite).toBe(false);
});
