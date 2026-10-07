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
import fs from 'fs';
import os from 'os';
import path from 'path';

import readJourneyDataSetUsers from './readJourneyDataSetUsers.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-coverage-users-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'data', 'tickets.yaml'),
    'users:\n  alice:\n    id: u_1\n    roles: [member]\n'
  );
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', 'broken.yaml'), 'snapshot: {}\n');
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('readJourneyDataSetUsers reads the users of each data set the journeys name', async () => {
  const logger = { warn: jest.fn() };
  const users = await readJourneyDataSetUsers({
    configDirectory,
    journeys: [{ data: 'tickets', user: 'alice' }, { data: 'tickets' }, { user: { roles: [] } }],
    logger,
  });
  expect([...users.keys()]).toEqual(['tickets']);
  expect(users.get('tickets')).toEqual({ alice: { id: 'u_1', roles: ['member'] } });
  expect(logger.warn).not.toHaveBeenCalled();
});

test('readJourneyDataSetUsers warns about and leaves out a data set it cannot read', async () => {
  const logger = { warn: jest.fn() };
  const users = await readJourneyDataSetUsers({
    configDirectory,
    journeys: [{ data: 'broken', user: 'alice' }],
    logger,
  });
  expect(users.size).toBe(0);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toContain('data set "broken"');
});
