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

import * as errors from '@lowdefy/errors';
import { expect, test, vi } from 'vitest';

import createFaultSink from './createFaultSink.js';

const testApp = { modules: { errors } };

// One key: a routine step on line 12 of api/approve.yaml.
const maps = {
  'keyMap.json': {
    k1: { key: 'root.api[0:approve:Api].routine[0:load:MongoDBFindOne]', '~r': '2', '~l': 12 },
  },
  'refMap.json': { 1: { parent: null }, 2: { parent: '1', path: 'api/approve.yaml' } },
};

function createContext() {
  return { readConfigFile: vi.fn(async (filePath) => maps[filePath]) };
}

test('createFaultSink lists the fault, marks it handled and gives it the config location the server logs', async () => {
  const faults = [];
  const handleError = createFaultSink({ context: createContext(), faults, testApp });
  const fault = new errors.ConfigError('Connection "ledger" does not exist.', { configKey: 'k1' });
  await handleError(fault);
  expect(faults).toEqual([fault]);
  expect(fault.handled).toBe(true);
  expect(fault.source).toEqual('api/approve.yaml:12');
  expect(fault.config).toEqual('root.api[0:approve:Api].routine[0:load:MongoDBFindOne]');
});

test('createFaultSink lists a fault with no config key without a location', async () => {
  const faults = [];
  const handleError = createFaultSink({ context: createContext(), faults, testApp });
  const fault = new Error('socket hang up');
  await handleError(fault);
  expect(faults).toEqual([fault]);
  expect(fault.handled).toBe(true);
  expect(fault.source).toBeUndefined();
});

test('createFaultSink does not look up a location for an internal Lowdefy error', async () => {
  const context = createContext();
  const faults = [];
  const fault = new errors.LowdefyInternalError('Invalid routine.');
  await createFaultSink({ context, faults, testApp })(fault);
  expect(faults).toEqual([fault]);
  expect(context.readConfigFile).not.toHaveBeenCalled();
});
