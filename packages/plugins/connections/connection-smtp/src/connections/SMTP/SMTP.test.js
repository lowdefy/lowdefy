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
import SMTP from './SMTP.js';

const schema = SMTP.schema;

test('All requests are present', () => {
  expect(SMTP.requests.SMTPMailSend).toBeDefined();
});

test('email send capability is present', () => {
  expect(SMTP.email.send).toBeDefined();
});

test('valid connection schema, all email variations', () => {
  let connection = {
    from: 'someone@example.com',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    from: 'Some One <someone@example.com>',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    from: {
      name: 'Some One',
      email: 'someone@example.com',
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
  connection = {
    from: ['someone@example.com', 'someoneelse@example.com'],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, transport and filter properties', () => {
  const connection = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user',
      pass: 'pass',
    },
    from: 'someone@example.com',
    replyTo: 'reply@example.com',
    filter: {
      replaceAddress: null,
      allowlist: ['example.com'],
      regex: '^someone@',
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, undeclared transport options pass through', () => {
  const connection = {
    service: 'gmail',
    pool: true,
    tls: {
      rejectUnauthorized: false,
    },
    from: 'someone@example.com',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, null filter', () => {
  const connection = {
    from: 'someone@example.com',
    filter: null,
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('property from is missing', () => {
  const connection = {
    host: 'smtp.example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SMTP connection should have required property "from".'
  );
});

test('property from is not a string', () => {
  const connection = {
    from: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SMTP connection property "/from" should be a string.; SMTP connection property "/from" should be an email address, or a list of email addresses'
  );
});

test('property host is not a string', () => {
  const connection = {
    host: true,
    from: 'someone@example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SMTP connection property "host" should be a string.'
  );
});

test('property port is not an integer', () => {
  const connection = {
    port: 'not-a-port',
    from: 'someone@example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SMTP connection property "port" should be an integer.'
  );
});

test('property secure is not a boolean', () => {
  const connection = {
    secure: 'yes',
    from: 'someone@example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SMTP connection property "secure" should be a boolean.'
  );
});

test('property auth is not an object', () => {
  const connection = {
    auth: 'user:pass',
    from: 'someone@example.com',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'SMTP connection property "auth" should be an object.'
  );
});

test('filter with unknown property is invalid', () => {
  const connection = {
    from: 'someone@example.com',
    filter: {
      blocklist: ['example.com'],
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow();
});
