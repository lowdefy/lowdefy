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
import { jest } from '@jest/globals';

jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: jest.fn(() => ({})),
}));
jest.unstable_mockModule('./getHazards.js', () => ({
  default: jest.fn(() => []),
}));

const { default: getSchema } = await import('./getSchema.js');
const { VALID_CHECK_SLUGS } = await import('@lowdefy/errors');

test('getSchema serves the whole ~ignoreBuildChecks catalogue', () => {
  const result = getSchema({ kind: 'checks', type: '~ignoreBuildChecks' });
  expect(result.kind).toBe('checks');
  expect(result.type).toBe('~ignoreBuildChecks');
  expect(result.description).toContain('~ignoreBuildChecks');
  expect(result.slugs).toHaveLength(Object.keys(VALID_CHECK_SLUGS).length);
  expect(result.slugs).toContainEqual({
    slug: 'state-refs',
    description: VALID_CHECK_SLUGS['state-refs'],
  });
});

test('getSchema serves the catalogue for kind checks with no type and for "all"', () => {
  expect(getSchema({ kind: 'checks' }).slugs.length).toBeGreaterThan(0);
  expect(getSchema({ kind: 'checks', type: 'all' }).slugs.length).toBeGreaterThan(0);
});

test('getSchema serves one check slug with its description', () => {
  expect(getSchema({ kind: 'checks', type: 'block-types' })).toEqual({
    kind: 'checks',
    type: 'block-types',
    slug: 'block-types',
    description: VALID_CHECK_SLUGS['block-types'],
  });
});

test('getSchema returns null for a check slug that does not exist', () => {
  expect(getSchema({ kind: 'checks', type: 'not-a-slug' })).toBe(null);
});

test('getSchema names checks among the kinds it accepts', () => {
  expect(() => getSchema({ kind: 'nonsense', type: 'x' })).toThrow(
    'blocks, operators, actions, connections, requests, checks'
  );
});

test('getSchema still returns null for a plugin type with no schema artifact entry', () => {
  expect(getSchema({ kind: 'blocks', type: 'Button' })).toBe(null);
});
