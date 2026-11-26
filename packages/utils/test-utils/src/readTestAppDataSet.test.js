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

import { beforeEach, expect, test, vi } from 'vitest';

const mockReadDataSet = vi.fn();

vi.doMock('./dataSets/index.js', () => ({
  readDataSet: (...args) => mockReadDataSet(...args),
}));

const { default: readTestAppDataSet } = await import('./readTestAppDataSet.js');

let testApp;

beforeEach(() => {
  mockReadDataSet.mockReset();
  testApp = { dataSets: new Map(), directories: { build: '/app/build', config: '/app' } };
});

test('readTestAppDataSet reads a data set once per test app', async () => {
  mockReadDataSet.mockResolvedValue({ name: 'crm', users: { owner: { id: 'o' } } });
  const first = await readTestAppDataSet({ name: 'crm', testApp });
  const second = await readTestAppDataSet({ name: 'crm', testApp });
  expect(second).toBe(first);
  expect(mockReadDataSet).toHaveBeenCalledTimes(1);
  expect(mockReadDataSet).toHaveBeenCalledWith({
    configDirectory: '/app',
    buildDirectory: '/app/build',
    name: 'crm',
  });
});

test('readTestAppDataSet reads each data set on its own', async () => {
  mockReadDataSet.mockImplementation(async ({ name }) => ({ name }));
  expect((await readTestAppDataSet({ name: 'crm', testApp })).name).toEqual('crm');
  expect((await readTestAppDataSet({ name: 'roles', testApp })).name).toEqual('roles');
  expect(mockReadDataSet).toHaveBeenCalledTimes(2);
});

test('readTestAppDataSet freezes the data set its sessions share', async () => {
  mockReadDataSet.mockResolvedValue({ name: 'crm', fixtures: { contacts: [{ _id: 'c1' }] } });
  const dataSet = await readTestAppDataSet({ name: 'crm', testApp });
  expect(() => {
    dataSet.fixtures.contacts[0].name = 'changed';
  }).toThrow(TypeError);
});

test('readTestAppDataSet reads a data set that failed again on the next session', async () => {
  mockReadDataSet.mockRejectedValueOnce(new Error('Data set tests/data/crm.yaml: bad'));
  mockReadDataSet.mockResolvedValueOnce({ name: 'crm' });
  await expect(readTestAppDataSet({ name: 'crm', testApp })).rejects.toThrow('bad');
  expect((await readTestAppDataSet({ name: 'crm', testApp })).name).toEqual('crm');
  expect(mockReadDataSet).toHaveBeenCalledTimes(2);
});
