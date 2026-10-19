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

import getAuthKeys from './getAuthKeys.js';

test('getAuthKeys returns an empty array when auth is undefined', () => {
  expect(getAuthKeys({ components: {} })).toEqual([]);
});

test('getAuthKeys returns an empty array when auth is not an object', () => {
  expect(getAuthKeys({ components: { auth: 'auth' } })).toEqual([]);
});

test('getAuthKeys filters out build marker keys', () => {
  const components = {
    auth: {
      '~ignoreBuildChecks': true,
      '~r': {},
      '~l': {},
      '~k': '1',
      secret: { _secret: 'BETTER_AUTH_SECRET' },
    },
  };
  expect(getAuthKeys({ components })).toEqual(['secret']);
});

test('getAuthKeys returns an empty array when auth only contains marker keys', () => {
  const components = { auth: { '~k': '1', '~r': {} } };
  expect(getAuthKeys({ components })).toEqual([]);
});
