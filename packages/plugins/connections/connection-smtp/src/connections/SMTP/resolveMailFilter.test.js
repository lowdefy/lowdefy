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

import resolveMailFilter from './resolveMailFilter.js';

const environment = { name: 'staging', email: { filter: { replaceAddress: 'team@example.com' } } };

test('resolveMailFilter uses the connection filter when set', () => {
  expect(
    resolveMailFilter({ connection: { filter: { allowlist: ['example.com'] } }, environment })
  ).toEqual({ allowlist: ['example.com'] });
});

test('resolveMailFilter falls back to the environment filter when the connection filter is unset', () => {
  expect(resolveMailFilter({ connection: {}, environment })).toEqual({
    replaceAddress: 'team@example.com',
  });
  expect(resolveMailFilter({ connection: { filter: null }, environment })).toEqual({
    replaceAddress: 'team@example.com',
  });
});

test('resolveMailFilter turns filtering off, the environment filter too, when the filter is false', () => {
  expect(resolveMailFilter({ connection: { filter: false }, environment })).toBe(null);
});

test('resolveMailFilter returns null without a connection or environment filter', () => {
  expect(resolveMailFilter({ connection: {}, environment: null })).toBe(null);
});
