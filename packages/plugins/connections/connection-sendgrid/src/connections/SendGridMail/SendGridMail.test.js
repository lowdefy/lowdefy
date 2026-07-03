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

import { validate } from '@lowdefy/ajv';
import SendGridMail from './SendGridMail.js';

const schema = SendGridMail.schema;

test('All requests are present', () => {
  expect(SendGridMail.requests.SendGridMailSend).toBeDefined();
});

test('email.send capability is present', () => {
  expect(SendGridMail.email.send).toBeDefined();
});

test('valid connection schema', () => {
  let connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    apiKey: 'API_KEY',
    from: 'Some One <someone@example.com>',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    apiKey: 'API_KEY',
    from: {
      name: 'Some One',
      email: 'someone@example.com',
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all email variations', () => {
  let connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    apiKey: 'API_KEY',
    from: 'Some One <someone@example.com>',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    apiKey: 'API_KEY',
    from: {
      name: 'Some One',
      email: 'someone@example.com',
    },
  };
  connection = {
    apiKey: 'API_KEY',
    from: ['someone@example.com', 'someoneelse@example.com'],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    apiKey: 'API_KEY',
    from: ['Some One <someone@example.com>', 'Some One Else <someoneelse@example.com>'],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    apiKey: 'API_KEY',
    from: [
      {
        name: 'Some One',
        email: 'someone@example.com',
      },
      {
        name: 'Some One Else',
        email: 'someoneelse@example.com',
      },
    ],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: {
      name: 'Some One',
      email: 'someone@example.com',
    },
    replyTo: 'reply@example.com',
    templateId: 'templateId',
    mailSettings: {
      sandboxMode: {
        enable: true,
      },
    },
    filter: {
      replaceAddress: 'dev@example.com',
      allowlist: ['example.com'],
      regex: '^dev',
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, filter properties may be null', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
    filter: {
      replaceAddress: null,
      allowlist: null,
      regex: null,
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('property filter is not an object', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
    filter: 'filter',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection property "filter" should be an object.'
  );
});

test('property filter.replaceAddress is not a string', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
    filter: {
      replaceAddress: true,
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection property "filter.replaceAddress" should be a string.'
  );
});

test('property filter.allowlist is not an array', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
    filter: {
      allowlist: 'example.com',
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection property "filter.allowlist" should be an array.'
  );
});

test('property filter.regex is not a string', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: 'someone@example.com',
    filter: {
      regex: true,
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection property "filter.regex" should be a string.'
  );
});

test('property apiKey is missing', () => {
  const connection = {
    from: 'someone@example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection should have required property "apiKey".'
  );
});

test('property apiKey is not a string', () => {
  const connection = {
    apiKey: true,
    from: 'someone@example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection property "apiKey" should be a string.'
  );
});

test('property from is missing', () => {
  const connection = {
    apiKey: 'API_KEY',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection should have required property "from".'
  );
});

test('property from is not a string', () => {
  const connection = {
    apiKey: 'API_KEY',
    from: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SendGridMail connection property "/from" should be a string.; SendGridMail connection property "/from" should be an email address, or a list of email addresses'
  );
});
