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

import { ConfigError, UserError } from '@lowdefy/errors';

import omitErrorProps from './omitErrorProps.js';

test('omitErrorProps prunes a non-Error cause on a plain error', () => {
  const error = new ConfigError('Bad config.', { cause: { routine: {} } });
  expect(omitErrorProps(error)).toEqual(['received', 'stack', 'cause']);
});

test('omitErrorProps keeps an Error cause', () => {
  const error = new ConfigError('Bad config.', { cause: new Error('inner') });
  expect(omitErrorProps(error)).toEqual(['received', 'stack']);
});

test('omitErrorProps keeps a UserError cause payload', () => {
  const error = new UserError('Invalid input.', { cause: { errors: ['too short'] } });
  expect(omitErrorProps(error)).toEqual(['received', 'stack']);
});

test('omitErrorProps identifies a UserError by name across a package boundary', () => {
  // A UserError constructed by another copy of @lowdefy/errors fails instanceof
  // but is still the class whose payload the author wrote for the client.
  const error = new Error('Invalid input.', { cause: { errors: ['too short'] } });
  error.name = 'UserError';
  expect(omitErrorProps(error)).toEqual(['received', 'stack']);
});
