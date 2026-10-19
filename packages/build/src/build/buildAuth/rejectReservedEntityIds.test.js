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

import rejectReservedEntityIds from './rejectReservedEntityIds.js';

test('rejectReservedEntityIds accepts ordinary ids', () => {
  const components = {
    pages: [{ id: 'home' }],
    api: [{ id: 'lookup' }],
    agents: [{ id: 'assistant' }],
  };
  expect(() => rejectReservedEntityIds({ components })).not.toThrow();
});

test('rejectReservedEntityIds accepts a config with no entities', () => {
  expect(() => rejectReservedEntityIds({ components: {} })).not.toThrow();
});

test('rejectReservedEntityIds throws a located error for a reserved page id', () => {
  const components = { pages: [{ id: '__proto__', '~k': 'pageKey' }] };
  expect(() => rejectReservedEntityIds({ components })).toThrow(
    'Page id "__proto__" is a reserved name and cannot be used as an id.'
  );
  try {
    rejectReservedEntityIds({ components });
  } catch (e) {
    expect(e.configKey).toBe('pageKey');
  }
});

test('rejectReservedEntityIds throws a located error for a reserved endpoint id', () => {
  const components = { api: [{ id: 'constructor', '~k': 'endpointKey' }] };
  expect(() => rejectReservedEntityIds({ components })).toThrow(
    'Endpoint id "constructor" is a reserved name and cannot be used as an id.'
  );
});

test('rejectReservedEntityIds throws a located error for a reserved agent id', () => {
  const components = { agents: [{ id: 'prototype', '~k': 'agentKey' }] };
  expect(() => rejectReservedEntityIds({ components })).toThrow(
    'Agent id "prototype" is a reserved name and cannot be used as an id.'
  );
});
