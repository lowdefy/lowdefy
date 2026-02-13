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

import collectTypeNames from './collectTypeNames.js';

test('collectTypeNames returns empty Set for empty typesMap', () => {
  const result = collectTypeNames({ typesMap: {} });
  expect(result.size).toBe(0);
});

test('collectTypeNames returns empty Set for undefined typesMap', () => {
  const result = collectTypeNames({ typesMap: undefined });
  expect(result.size).toBe(0);
});

test('collectTypeNames returns empty Set for null typesMap', () => {
  const result = collectTypeNames({ typesMap: null });
  expect(result.size).toBe(0);
});

test('collectTypeNames collects block type names', () => {
  const typesMap = {
    blocks: {
      TextInput: {},
      Button: {},
      Card: {},
    },
  };

  const result = collectTypeNames({ typesMap });
  expect(result.size).toBe(3);
  expect(result.has('TextInput')).toBe(true);
  expect(result.has('Button')).toBe(true);
  expect(result.has('Card')).toBe(true);
});

test('collectTypeNames collects request type names', () => {
  const typesMap = {
    requests: {
      MongoDBFind: {},
      AxiosHttp: {},
    },
  };

  const result = collectTypeNames({ typesMap });
  expect(result.size).toBe(2);
  expect(result.has('MongoDBFind')).toBe(true);
  expect(result.has('AxiosHttp')).toBe(true);
});

test('collectTypeNames collects from all categories', () => {
  const typesMap = {
    blocks: {
      TextInput: {},
      Button: {},
    },
    requests: {
      MongoDBFind: {},
    },
    connections: {
      MongoDBCollection: {},
    },
    actions: {
      SetState: {},
      CallMethod: {},
    },
    controls: {
      CustomControl: {},
    },
  };

  const result = collectTypeNames({ typesMap });
  expect(result.size).toBe(7);
  expect(result.has('TextInput')).toBe(true);
  expect(result.has('Button')).toBe(true);
  expect(result.has('MongoDBFind')).toBe(true);
  expect(result.has('MongoDBCollection')).toBe(true);
  expect(result.has('SetState')).toBe(true);
  expect(result.has('CallMethod')).toBe(true);
  expect(result.has('CustomControl')).toBe(true);
});

test('collectTypeNames ignores non-object categories', () => {
  const typesMap = {
    blocks: {
      TextInput: {},
    },
    requests: null,
    connections: 'not an object',
    actions: 42,
  };

  const result = collectTypeNames({ typesMap });
  expect(result.size).toBe(1);
  expect(result.has('TextInput')).toBe(true);
});

test('collectTypeNames ignores unknown categories', () => {
  const typesMap = {
    blocks: {
      TextInput: {},
    },
    unknownCategory: {
      SomeType: {},
    },
  };

  const result = collectTypeNames({ typesMap });
  expect(result.size).toBe(1);
  expect(result.has('TextInput')).toBe(true);
  expect(result.has('SomeType')).toBe(false);
});
