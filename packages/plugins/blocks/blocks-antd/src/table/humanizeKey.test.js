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

import humanizeKey from './humanizeKey.js';

test('humanizeKey turns snake, kebab, camel and dotted keys into a sentence-case title', () => {
  expect(humanizeKey('first_name')).toBe('First name');
  expect(humanizeKey('first-name')).toBe('First name');
  expect(humanizeKey('firstName')).toBe('First name');
  expect(humanizeKey('owner.firstName')).toBe('Owner first name');
  expect(humanizeKey('amount')).toBe('Amount');
});

test('humanizeKey keeps acronyms in capitals', () => {
  expect(humanizeKey('customerID')).toBe('Customer ID');
  expect(humanizeKey('HTMLBody')).toBe('HTML body');
  expect(humanizeKey('_id')).toBe('Id');
});

test('humanizeKey returns an empty string for a missing key', () => {
  expect(humanizeKey(undefined)).toBe('');
  expect(humanizeKey('__')).toBe('');
});
