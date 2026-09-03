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
    '~ignoreBuildChecks': ['state-refs'],
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
  expect(VALID_CHECK_SLUGS['schema']).toBeDefined();
});

test('VALID_CHECK_SLUGS includes every slug the build emits', () => {
  expect(VALID_CHECK_SLUGS['connection-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['callapi-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['callapi-internal-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['dynamic-endpoint-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['websocket-refs']).toBeDefined();
  expect(VALID_CHECK_SLUGS['icons']).toBeDefined();
});

test('VALID_CHECK_SLUGS has one slug per emitting rule, not a grab-bag', () => {
  // The grab-bag slugs are gone: suppressing an unknown block type must not
  // also suppress an unknown connection type.
  expect(VALID_CHECK_SLUGS['types']).toBeUndefined();
  expect(VALID_CHECK_SLUGS['tenant']).toBeUndefined();
  expect(VALID_CHECK_SLUGS['migrations']).toBeUndefined();
  expect(VALID_CHECK_SLUGS['expression']).toBeUndefined();
  expect(VALID_CHECK_SLUGS['block-types']).toBeDefined();
  expect(VALID_CHECK_SLUGS['connection-types']).toBeDefined();
  expect(VALID_CHECK_SLUGS['tenant-run-as']).toBeDefined();
  expect(VALID_CHECK_SLUGS['tenant-inventory']).toBeDefined();
  expect(VALID_CHECK_SLUGS['migration-files']).toBeDefined();
  expect(VALID_CHECK_SLUGS['migration-routine']).toBeDefined();
  expect(VALID_CHECK_SLUGS['payload-schema']).toBeDefined();
  expect(VALID_CHECK_SLUGS['duplicate-block-id']).toBeDefined();
});

test('every VALID_CHECK_SLUGS description is a non-empty string', () => {
  Object.entries(VALID_CHECK_SLUGS).forEach(([slug, description]) => {
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
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

test('returns true when a parent lists the checkSlug', () => {
  expect(
    shouldSuppressBuildCheck({ configKey: 'withParent', checkSlug: 'state-refs' }, keyMap)
  ).toBe(true);
});

test('returns true when the entry itself lists the checkSlug', () => {
  expect(
    shouldSuppressBuildCheck({ configKey: 'parentWithIgnore', checkSlug: 'state-refs' }, keyMap)
  ).toBe(true);
});

test('a check with no slug is never suppressed', () => {
  expect(shouldSuppressBuildCheck({ configKey: 'withParent' }, keyMap)).toBe(false);
});

test('ignoreBuildChecks: true no longer suppresses anything', () => {
  const trueKeyMap = { k1: { key: 'root', '~ignoreBuildChecks': true } };
  expect(shouldSuppressBuildCheck({ configKey: 'k1', checkSlug: 'state-refs' }, trueKeyMap)).toBe(
    false
  );
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
    shouldSuppressBuildCheck({ configKey: 'childOfPartial', checkSlug: 'block-types' }, keyMap)
  ).toBe(false);
});
