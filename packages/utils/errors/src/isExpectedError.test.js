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

import AuthenticationError from './AuthenticationError.js';
import AuthorizationError from './AuthorizationError.js';
import ConfigError from './ConfigError.js';
import LowdefyInternalError from './LowdefyInternalError.js';
import RequestError from './RequestError.js';
import ServiceError from './ServiceError.js';
import TwoFactorEnrolmentRequiredError from './TwoFactorEnrolmentRequiredError.js';
import UserError from './UserError.js';
import isExpectedError from './isExpectedError.js';
import { expect, test } from 'vitest';

test('isExpectedError is true for every expected outcome class', () => {
  expect(isExpectedError(new UserError('No.'))).toBe(true);
  expect(isExpectedError(new AuthenticationError('Sign in.'))).toBe(true);
  expect(isExpectedError(new AuthorizationError('Not allowed.'))).toBe(true);
  expect(isExpectedError(new TwoFactorEnrolmentRequiredError('Enrol.'))).toBe(true);
});

test('isExpectedError is false for faults', () => {
  expect(isExpectedError(new ConfigError('Bad config.'))).toBe(false);
  expect(isExpectedError(new LowdefyInternalError('Bug.'))).toBe(false);
  expect(isExpectedError(new ServiceError('Down.', { service: 'X' }))).toBe(false);
  expect(isExpectedError(new RequestError('Failed.'))).toBe(false);
  expect(isExpectedError(new Error('Plain.'))).toBe(false);
});

test('isExpectedError reads the name of a revived error and tolerates a non-error', () => {
  expect(isExpectedError({ name: 'UserError', message: 'Revived.' })).toBe(true);
  expect(isExpectedError(undefined)).toBe(false);
  expect(isExpectedError('UserError')).toBe(false);
});
