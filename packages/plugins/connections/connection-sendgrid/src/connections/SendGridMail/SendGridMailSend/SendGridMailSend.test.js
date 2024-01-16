/*
  Copyright 2020-2024 Lowdefy, Inc

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

jest.unstable_mockModule('@sendgrid/mail', () => {
  return {
    default: {
      setApiKey: jest.fn(),
      send: (msg) => {
        if (msg[0].to === 'response_error') {
          const error = new Error('Test error.');
          error.response = { body: ['Test error 1.', 'Test error 2.'] };
          throw error;
        }
        if (msg[0].to === 'generic_error') {
          throw new Error('Test error.');
        }
        mockSend(msg);
        return Promise.resolve(msg);
      },
    },
  };
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

test('send with valid request and connection', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const request = {
    to: 'a@b.com',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: { name: 'a@b.om', email: 'a.cc@mm.co' },
  };
  const send = await SendGridMailSend({ request, connection });
  expect(mockSend.mock.calls).toEqual([
    [
      [
        {
          from: { email: 'a.cc@mm.co', name: 'a@b.om' },
          mailSettings: undefined,
          subject: 'A',
          templateId: undefined,
          text: 'B',
          to: 'a@b.com',
        },
      ],
    ],
  ]);
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('send to list of emails', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const request = {
    to: ['a@b.com', 'aaa bbb <aaa@bbb.com>', { name: 'ccc', email: 'ddd@eee.com' }],
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
  };
  const send = await SendGridMailSend({ request, connection });
  expect(mockSend.mock.calls).toEqual([
    [
      [
        {
          from: 'x@y.com',
          mailSettings: undefined,
          subject: 'A',
          templateId: undefined,
          text: 'B',
          to: ['a@b.com', 'aaa bbb <aaa@bbb.com>', { email: 'ddd@eee.com', name: 'ccc' }],
        },
      ],
    ],
  ]);
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('send a list of different emails', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const request = [
    {
      to: 'a@b.com',
      subject: 'A',
      text: 'A',
    },
    {
      to: 'b@b.com',
      subject: 'B',
      text: 'B',
    },
  ];
  const connection = {
    apiKey: 'X',
    from: 'x@y.com',
  };
  const send = await SendGridMailSend({ request, connection });
  expect(mockSend.mock.calls).toEqual([
    [
      [
        {
          from: 'x@y.com',
          mailSettings: undefined,
          subject: 'A',
          templateId: undefined,
          text: 'A',
          to: 'a@b.com',
        },
        {
          from: 'x@y.com',
          mailSettings: undefined,
          subject: 'B',
          templateId: undefined,
          text: 'B',
          to: 'b@b.com',
        },
      ],
    ],
  ]);
  expect(send).toEqual({
    response: 'Mail sent successfully',
  });
});

test('Error request with no to', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const schema = SendGridMailSend.schema;
  const request = {
    subject: 'A',
    text: 'B',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with to is not a email address', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const schema = SendGridMailSend.schema;
  const request = {
    subject: 'A',
    text: 'B',
    to: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with subject is not a string', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const schema = SendGridMailSend.schema;
  const request = {
    subject: true,
    text: 'B',
    to: 'a@b.com',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SendGridMailSend request property "subject" should be a string.; SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with text is not a string', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const schema = SendGridMailSend.schema;
  const request = {
    text: true,
    to: 'a@b.com',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with html is not a string', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const schema = SendGridMailSend.schema;
  const request = {
    html: true,
    to: 'a@b.com',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('Error request with dynamicTemplateData is not an object', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const schema = SendGridMailSend.schema;
  const request = {
    dynamicTemplateData: true,
    to: 'a@b.com',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'SendGridMailSend request properties should be an object or a array describing emails to send.'
  );
});

test('request throws an error', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const request = {
    to: 'generic_error',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: { name: 'a@b.om', email: 'a.cc@mm.co' },
  };
  await expect(() => SendGridMailSend({ request, connection })).rejects.toThrow('Test error.');
});

test('request throws an error with response body', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const request = {
    to: 'response_error',
    subject: 'A',
    text: 'B',
  };
  const connection = {
    apiKey: 'X',
    from: { name: 'a@b.om', email: 'a.cc@mm.co' },
  };
  await expect(() => SendGridMailSend({ request, connection })).rejects.toThrow(
    '["Test error 1.","Test error 2."]'
  );
});

test('checkRead should be false', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const { checkRead } = SendGridMailSend.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  const SendGridMailSend = (await import('./SendGridMailSend.js')).default;
  const { checkWrite } = SendGridMailSend.meta;
  expect(checkWrite).toBe(false);
});
