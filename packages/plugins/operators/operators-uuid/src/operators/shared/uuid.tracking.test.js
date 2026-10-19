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

import _uuid from './uuid.js';

function kind(callInfo) {
  return _uuid.tracking(callInfo).kind;
}

test('_uuid random forms are volatile', () => {
  expect(kind({ params: true })).toBe('volatile');
  expect(kind({ params: null })).toBe('volatile');
  expect(kind({ methodName: 'v4', params: null })).toBe('volatile');
  expect(kind({ methodName: 'v1', params: null })).toBe('volatile');
  expect(kind({ params: 'v1' })).toBe('volatile');
});

test('_uuid.v3 and _uuid.v5 are pure', () => {
  expect(kind({ methodName: 'v3', params: ['name', 'namespace'] })).toBe('pure');
  expect(kind({ methodName: 'v5', params: { name: 'name', namespace: 'namespace' } })).toBe('pure');
});
