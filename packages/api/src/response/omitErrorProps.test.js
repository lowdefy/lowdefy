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

import { ServiceError, UserError } from '@lowdefy/errors';

import omitErrorProps from './omitErrorProps.js';

test('omitErrorProps drops received and stack and keeps message, name and own fields in order', () => {
  const error = new Error('boom');
  error.received = { headers: { authorization: 'token' } };
  error.configKey = 'key-1';

  const props = omitErrorProps(error);

  expect(Object.keys(props)).toEqual(['message', 'name', 'configKey']);
  expect(props).toEqual({ message: 'boom', name: 'Error', configKey: 'key-1' });
});

test('omitErrorProps keeps an Error cause as the raw Error for the walk to project', () => {
  const inner = new Error('inner');
  const error = new Error('outer', { cause: inner });

  const props = omitErrorProps(error);

  expect(props.cause).toBe(inner);
  expect(Object.keys(props)).toEqual(['message', 'name', 'cause']);
});

test('omitErrorProps drops a non-Error cause on an internal error', () => {
  const error = new Error('outer', { cause: { routine: ['internal'] } });

  const props = omitErrorProps(error);

  expect('cause' in props).toBe(false);
});

test('omitErrorProps keeps a non-Error cause on a UserError', () => {
  const error = new UserError('Check your input.');
  error.cause = { field: 'email' };

  const props = omitErrorProps(error);

  expect(props.cause).toEqual({ field: 'email' });
  expect('stack' in props).toBe(false);
});

test('omitErrorProps drops the non-Error cause of a ServiceError', () => {
  const error = new ServiceError('Service unavailable.', { service: 'MongoDB' });
  error.cause = { host: 'db.internal' };

  const props = omitErrorProps(error);

  expect('cause' in props).toBe(false);
});
