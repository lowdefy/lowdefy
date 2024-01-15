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

import { validate } from '@lowdefy/ajv';
import Redis from './Redis.js';

const schema = Redis.schema;

test('All requests are present', () => {
  expect(Redis.requests.Redis).toBeDefined();
});

test('valid connection schema, with string', () => {
  const connection = {
    connection: '/path',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, with object', () => {
  const connection = {
    connection: {
      socket: {
        host: 'https://example.com/redis',
        port: 6379,
      },
      username: 'username',
      password: 'password',
      database: 5,
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('invalid connection schema', () => {
  const connection = {
    connection: null,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Redis connection property "connection" should be a string or object.'
  );
});
