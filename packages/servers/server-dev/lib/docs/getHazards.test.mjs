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

import setupTestFixtures from './setupTestFixtures.mjs';

// getHazards reads build artifacts from process.cwd() — point it at the
// fixture server before the module is imported.
const fixtureDir = setupTestFixtures();
process.chdir(fixtureDir);

// The framework list ships in @lowdefy/docs-content; mock the loader so each
// test controls the list (and the "package not installed" case).
const mockLoadFrameworkHazards = jest.fn();
jest.unstable_mockModule('./loadFrameworkHazards.js', () => ({
  default: mockLoadFrameworkHazards,
}));

const { default: getHazards } = await import('./getHazards.js');

const frameworkHazards = [
  {
    id: 'state-in-request-properties',
    appliesTo: { kinds: ['requests'] },
    message: '_state in request properties is always undefined.',
    see: 'concepts/connections-and-requests',
  },
  {
    id: 'visible-false-prunes-state',
    appliesTo: { kinds: ['blocks'] },
    message: 'visible: false removes the block and its state.',
    see: 'concepts/lowdefy-schema',
  },
  {
    id: 'link-same-page-no-onmount',
    appliesTo: { types: ['Link'] },
    message: 'A Link to the page already open does not remount it.',
    see: 'actions/link',
  },
  {
    id: 'tenant-wall-lookup',
    appliesTo: { kinds: ['requests'], when: 'connectionTenantNotNone' },
    message: 'The wall injects a tenant match into every lookup.',
    see: null,
  },
];

let warnSpy;

beforeEach(() => {
  mockLoadFrameworkHazards.mockReset();
  mockLoadFrameworkHazards.mockReturnValue(frameworkHazards);
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

test('getHazards returns type-attached hazards only when no framework hazard applies', () => {
  mockLoadFrameworkHazards.mockReturnValue([]);
  expect(getHazards({ kind: 'operators', type: '_get' })).toEqual([
    { id: 'get-fixture-hazard', message: '_get fixture hazard.', see: 'operators/_get' },
  ]);
});

test('getHazards returns framework hazards only when the type declares none', () => {
  const hazards = getHazards({ kind: 'blocks', type: 'Button' });
  expect(hazards).toEqual([
    {
      id: 'visible-false-prunes-state',
      message: 'visible: false removes the block and its state.',
      see: 'concepts/lowdefy-schema',
    },
  ]);
});

test('getHazards matches framework hazards by exact type name across kinds', () => {
  const hazards = getHazards({ kind: 'actions', type: 'Link' });
  expect(hazards.map((hazard) => hazard.id)).toEqual(['link-same-page-no-onmount']);
  expect(getHazards({ kind: 'actions', type: 'SetState' })).toEqual([]);
});

test('getHazards merges both sources, type-attached first, de-duplicated by id', () => {
  const hazards = getHazards({ kind: 'blocks', type: 'TestBlock' });
  expect(hazards.map((hazard) => hazard.id)).toEqual([
    'test-block-hazard',
    'visible-false-prunes-state',
  ]);
  expect(hazards[1].message).toEqual('Plugin wording for visible: false.');
});

test('getHazards accepts singular kind names', () => {
  expect(getHazards({ kind: 'block', type: 'Button' }).map((hazard) => hazard.id)).toEqual([
    'visible-false-prunes-state',
  ]);
});

test('getHazards evaluates connectionTenantNotNone true for a request over a walled connection', () => {
  const hazards = getHazards({
    kind: 'requests',
    type: 'WriteRequest',
    connectionId: 'tenant_db',
  });
  expect(hazards.map((hazard) => hazard.id)).toEqual([
    'write-request-hazard',
    'state-in-request-properties',
    'tenant-wall-lookup',
  ]);
});

test('getHazards evaluates connectionTenantNotNone false for a shared connection or no connectionId', () => {
  const shared = getHazards({ kind: 'requests', type: 'WriteRequest', connectionId: 'shared_db' });
  expect(shared.map((hazard) => hazard.id)).toEqual([
    'write-request-hazard',
    'state-in-request-properties',
  ]);
  const noConnection = getHazards({ kind: 'requests', type: 'WriteRequest' });
  expect(noConnection.map((hazard) => hazard.id)).toEqual([
    'write-request-hazard',
    'state-in-request-properties',
  ]);
});

test('getHazards never applies connectionTenantNotNone outside requests', () => {
  const hazards = getHazards({ kind: 'blocks', type: 'Button', connectionId: 'tenant_db' });
  expect(hazards.map((hazard) => hazard.id)).toEqual(['visible-false-prunes-state']);
});

test('getHazards skips a hazard with an unknown when condition and warns once', () => {
  mockLoadFrameworkHazards.mockReturnValue([
    {
      id: 'mystery',
      appliesTo: { kinds: ['blocks'], when: 'moonIsFull' },
      message: 'Never shown.',
      see: null,
    },
  ]);
  expect(getHazards({ kind: 'blocks', type: 'Button' })).toEqual([]);
  expect(getHazards({ kind: 'blocks', type: 'Button' })).toEqual([]);
  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(warnSpy.mock.calls[0][0]).toContain('"moonIsFull"');
});

test('getHazards returns an empty list when hazards.json is unavailable and the type has none', () => {
  mockLoadFrameworkHazards.mockReturnValue(null);
  expect(getHazards({ kind: 'blocks', type: 'Button' })).toEqual([]);
});

test('getHazards still returns type-attached hazards when hazards.json is unavailable', () => {
  mockLoadFrameworkHazards.mockReturnValue(null);
  expect(getHazards({ kind: 'blocks', type: 'TestBlock' }).map((hazard) => hazard.id)).toEqual([
    'test-block-hazard',
    'visible-false-prunes-state',
  ]);
});

test('getHazards returns an empty list for kinds and types without hazards', () => {
  expect(getHazards({ kind: 'connections', type: 'AxiosHttp' })).toEqual([]);
  expect(getHazards({ kind: 'pages' })).toEqual([]);
  expect(getHazards({ kind: 'nonsense', type: 'X' })).toEqual([]);
});
