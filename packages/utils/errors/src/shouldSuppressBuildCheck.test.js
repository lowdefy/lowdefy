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

import shouldSuppressBuildCheck, { VALID_CHECK_SLUGS } from './shouldSuppressBuildCheck.js';

const keyMap = {
  abc123: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
  },
  withParent: {
    key: 'root.pages[0:home].blocks[0:header].properties',
    '~r': 'ref1',
    '~l': 10,
    '~k_parent': 'parentWithIgnore',
  },
  parentWithIgnore: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
    '~ignoreBuildChecks': true,
  },
  parentWithPartialIgnore: {
    key: 'root.pages[0:home]',
    '~r': 'ref1',
    '~l': 1,
    '~ignoreBuildChecks': ['state-refs', 'link-refs'],
  },
  childOfPartial: {
    key: 'root.pages[0:home].blocks',
    '~r': 'ref1',
    '~l': 20,
    '~k_parent': 'parentWithPartialIgnore',
  },
};

test('VALID_CHECK_SLUGS exports valid check slugs', () => {
  expect(VALID_CHECK_SLUGS['state-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['payload-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['link-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['request-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['types']).toBeDefined();
  expect(VALID_CHECK_SLUGS['schema']).toBeDefined();
});

test('returns false for missing configKey', () => {
  expect(shouldSuppressBuildCheck({ configKey: null }, keyMap)).toBe(false);
  expect(shouldSuppressBuildCheck({ configKey: undefined }, keyMap)).toBe(false);
});

test('returns false for missing keyMap', () => {
  expect(shouldSuppressBuildCheck({ configKey: 'abc123' }, null)).toBe(false);
});

test('returns false for configKey not in keyMap', () => {
  expect(shouldSuppressBuildCheck({ configKey: 'notfound' }, keyMap)).toBe(false);
});

test('returns false for entry without ignoreBuildChecks', () => {
  expect(shouldSuppressBuildCheck({ configKey: 'abc123' }, keyMap)).toBe(false);
});

test('returns true when parent has ignoreBuildChecks: true', () => {
  expect(shouldSuppressBuildCheck({ configKey: 'withParent' }, keyMap)).toBe(true);
});

test('returns true when entry itself has ignoreBuildChecks: true', () => {
  expect(shouldSuppressBuildCheck({ configKey: 'parentWithIgnore' }, keyMap)).toBe(true);
});

test('returns true when parent has matching checkSlug in array', () => {
  expect(
    shouldSuppressBuildCheck({ configKey: 'childOfPartial', checkSlug: 'state-refs' }, keyMap)
  ).toBe(true);

  expect(
    shouldSuppressBuildCheck({ configKey: 'childOfPartial', checkSlug: 'link-refs' }, keyMap)
  ).toBe(true);
});

test('returns false when parent has non-matching checkSlug', () => {
  expect(
    shouldSuppressBuildCheck({ configKey: 'childOfPartial', checkSlug: 'types' }, keyMap)
  ).toBe(false);
});
