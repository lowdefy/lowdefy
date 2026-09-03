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

const mockReadFixture = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({ readFixture: mockReadFixture }));

const context = { directories: { config: '/app' } };

beforeEach(() => {
  mockReadFixture.mockReset();
  mockReadFixture.mockImplementation(async ({ name }) => ({
    name,
    connections: [{ connectionId: `${name}_connection`, docs: [] }],
  }));
});

test('loadRequestTestFixtures reads each named fixture once from the config directory', async () => {
  const { default: loadRequestTestFixtures } = await import('./loadRequestTestFixtures.js');
  const fixtures = await loadRequestTestFixtures({
    context,
    items: [
      { test: { name: 'a', fixtures: ['base', 'org-a'] } },
      { test: { name: 'b', fixtures: ['base'] } },
      { test: { name: 'c' } },
      { error: 'Invalid YAML' },
    ],
  });
  expect(mockReadFixture).toHaveBeenCalledTimes(2);
  expect(mockReadFixture).toHaveBeenCalledWith({ configDirectory: '/app', name: 'base' });
  expect(mockReadFixture).toHaveBeenCalledWith({ configDirectory: '/app', name: 'org-a' });
  expect([...fixtures.keys()]).toEqual(['base', 'org-a']);
  expect(fixtures.get('base').fixture.connections[0].connectionId).toEqual('base_connection');
});

test('loadRequestTestFixtures records a load failure instead of throwing', async () => {
  const { default: loadRequestTestFixtures } = await import('./loadRequestTestFixtures.js');
  mockReadFixture.mockRejectedValueOnce(
    new Error('Fixture "missing" not found. Expected fixtures/missing.yaml.')
  );
  const fixtures = await loadRequestTestFixtures({
    context,
    items: [{ test: { name: 'a', fixtures: ['missing', 'base'] } }],
  });
  expect(fixtures.get('missing')).toEqual({
    error: 'Fixture "missing" not found. Expected fixtures/missing.yaml.',
  });
  expect(fixtures.get('base').fixture.name).toEqual('base');
});

test('loadRequestTestFixtures skips non-string names and leaves them to validation', async () => {
  const { default: loadRequestTestFixtures } = await import('./loadRequestTestFixtures.js');
  const fixtures = await loadRequestTestFixtures({
    context,
    items: [
      { test: { name: 'a', fixtures: [{ name: 'base' }, 3] } },
      { test: { fixtures: 'base' } },
    ],
  });
  expect(mockReadFixture).not.toHaveBeenCalled();
  expect(fixtures.size).toEqual(0);
});
