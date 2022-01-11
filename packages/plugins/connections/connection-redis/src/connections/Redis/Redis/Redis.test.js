/*
  Copyright 2020-2021 Lowdefy, Inc

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

const { checkRead, checkWrite } = Redis.meta;
const schema = Redis.schema;

test('valid request schema, with url', () => {
  const connection = {
    command: 'set',
    params: ['key', 10],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('command is not a string', () => {
  const connection = {
    command: true,
    params: ['key', 'value'],
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Redis request property "command" should be a string.'
  );
});

test('command is not valid', () => {
  const connection = {
    command: 'notValidCommand',
    params: ['key', 'value'],
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Redis request property "command" is not a valid value.'
  );
});

test('params are not valid for command', () => {
  const connection = {
    command: 'get',
    params: ['key', 'value'],
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Redis request property "params" should be a string.'
  );
});

test('params are not valid for command', () => {
  const connection = {
    command: 'set',
    params: 'key',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Redis request property "params" should be an array.'
  );
});

test('params are not present', () => {
  const connection = {
    command: 'set',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'Redis request property "params" should be present.'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});
