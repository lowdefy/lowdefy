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

import { expect, test } from 'vitest';
import getNextStoreVersion from './getNextStoreVersion.js';

test('the next patch after the latest build on the same major.minor', () => {
  expect(getNextStoreVersion({ entryVersion: '1.4', latestVersions: ['1.4.7'] })).toBe('1.4.8');
});

test('a new major.minor starts at patch 0', () => {
  expect(getNextStoreVersion({ entryVersion: '1.5', latestVersions: ['1.4.7'] })).toBe('1.5.0');
  expect(getNextStoreVersion({ entryVersion: '2.0', latestVersions: ['1.0.3'] })).toBe('2.0.0');
});

test('no previous build starts at patch 0', () => {
  expect(getNextStoreVersion({ entryVersion: '1.4', latestVersions: [null] })).toBe('1.4.0');
  expect(getNextStoreVersion({ entryVersion: '1.4', latestVersions: [] })).toBe('1.4.0');
});

test('when the stores differ, both get one past the higher', () => {
  expect(getNextStoreVersion({ entryVersion: '1.4', latestVersions: ['1.4.7', '1.4.9'] })).toBe(
    '1.4.10'
  );
  expect(getNextStoreVersion({ entryVersion: '1.4', latestVersions: [null, '1.4.2'] })).toBe(
    '1.4.3'
  );
});

test('a build version that is not major.minor.patch counts as no build', () => {
  expect(getNextStoreVersion({ entryVersion: '1.4', latestVersions: ['1.4.beta'] })).toBe('1.4.0');
});
