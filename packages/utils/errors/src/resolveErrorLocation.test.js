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

import resolveErrorLocation from './resolveErrorLocation.js';

const keyMap = {
  abc123: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
  },
};

const refMap = {
  ref1: { path: 'pages/home.yaml' },
};

// --- null/falsy data ---

test('resolveErrorLocation returns null for null data', () => {
  expect(resolveErrorLocation(null, { keyMap, refMap })).toBeNull();
});

test('resolveErrorLocation returns null for undefined data', () => {
  expect(resolveErrorLocation(undefined, { keyMap, refMap })).toBeNull();
});

test('resolveErrorLocation returns null when data has no configKey or filePath', () => {
  expect(resolveErrorLocation({}, { keyMap, refMap })).toBeNull();
});

// --- Path 1: configKey delegation to resolveConfigLocation ---

test('resolveErrorLocation resolves configKey via keyMap/refMap', () => {
  const result = resolveErrorLocation(
    { configKey: 'abc123' },
    { keyMap, refMap, configDirectory: '/app' }
  );
  expect(result).toEqual({
    source: '/app/pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveErrorLocation returns null when configKey not in keyMap', () => {
  expect(
    resolveErrorLocation({ configKey: 'missing' }, { keyMap, refMap, configDirectory: '/app' })
  ).toBeNull();
});

// --- Path 2: filePath + lineNumber ---

test('resolveErrorLocation resolves filePath with lineNumber', () => {
  const result = resolveErrorLocation(
    { filePath: 'pages/home.yaml', lineNumber: 12 },
    { keyMap, refMap, configDirectory: '/app' }
  );
  expect(result).toEqual({ source: '/app/pages/home.yaml:12' });
});

test('resolveErrorLocation resolves filePath without lineNumber', () => {
  const result = resolveErrorLocation(
    { filePath: 'pages/home.yaml' },
    { keyMap, refMap, configDirectory: '/app' }
  );
  expect(result).toEqual({ source: '/app/pages/home.yaml' });
});

test('resolveErrorLocation uses relative filePath when no configDirectory', () => {
  const result = resolveErrorLocation(
    { filePath: 'pages/home.yaml', lineNumber: 3 },
    { keyMap, refMap }
  );
  expect(result).toEqual({ source: 'pages/home.yaml:3' });
});

test('resolveErrorLocation uses absolute filePath as-is via path.resolve', () => {
  const result = resolveErrorLocation(
    { filePath: '/absolute/path.yaml', lineNumber: 1 },
    { keyMap, refMap, configDirectory: '/app' }
  );
  expect(result).toEqual({ source: '/absolute/path.yaml:1' });
});

// --- Path 1 takes precedence over Path 2 ---

test('resolveErrorLocation prefers configKey over filePath when both present', () => {
  const result = resolveErrorLocation(
    { configKey: 'abc123', filePath: 'other.yaml', lineNumber: 99 },
    { keyMap, refMap, configDirectory: '/app' }
  );
  expect(result).toEqual({
    source: '/app/pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveErrorLocation falls back to filePath when configKey lookup fails', () => {
  const result = resolveErrorLocation(
    { configKey: 'missing', filePath: 'fallback.yaml', lineNumber: 7 },
    { keyMap, refMap, configDirectory: '/app' }
  );
  expect(result).toEqual({ source: '/app/fallback.yaml:7' });
});
