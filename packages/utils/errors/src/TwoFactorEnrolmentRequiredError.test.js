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

import TwoFactorEnrolmentRequiredError from './TwoFactorEnrolmentRequiredError.js';

test('TwoFactorEnrolmentRequiredError sets name and isLowdefyError', () => {
  const error = new TwoFactorEnrolmentRequiredError();
  expect(error.name).toBe('TwoFactorEnrolmentRequiredError');
  expect(error.isLowdefyError).toBe(true);
  expect(error instanceof TwoFactorEnrolmentRequiredError).toBe(true);
  expect(error instanceof Error).toBe(true);
});

test('TwoFactorEnrolmentRequiredError uses the default message', () => {
  const error = new TwoFactorEnrolmentRequiredError();
  expect(error.message).toBe('Two-factor enrolment required.');
});

test('TwoFactorEnrolmentRequiredError sets a custom message', () => {
  const error = new TwoFactorEnrolmentRequiredError('Enrol a second factor to continue.');
  expect(error.message).toBe('Enrol a second factor to continue.');
});

test('TwoFactorEnrolmentRequiredError forwards cause to super', () => {
  const inner = new Error('inner failure');
  const error = new TwoFactorEnrolmentRequiredError('outer', { cause: inner });
  expect(error.cause).toBe(inner);
});

test('TwoFactorEnrolmentRequiredError without cause leaves cause undefined', () => {
  const error = new TwoFactorEnrolmentRequiredError('msg');
  expect(error.cause).toBeUndefined();
});
