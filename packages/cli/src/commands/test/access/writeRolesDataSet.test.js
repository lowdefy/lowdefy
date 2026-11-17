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

import { afterEach, beforeEach, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseDataSet } from '@lowdefy/node-utils';

import writeRolesDataSet from './writeRolesDataSet.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-roles-data-set-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('writeRolesDataSet writes a data set of the declared roles that passes the data set checks', async () => {
  const authJson = {
    configured: true,
    roles: [{ id: 'finance' }, { id: 'none' }, { id: '_ops' }],
    pages: { roles: { finance: ['billing'] } },
    api: { roles: { technician: ['approve'] } },
  };
  expect(writeRolesDataSet({ authJson, configDirectory })).toEqual([
    'finance',
    'no-role',
    'role-_ops',
    'role-none',
    'technician',
  ]);
  const { users } = await parseDataSet({ configDirectory, name: 'roles' });
  expect(users).toEqual({
    finance: { id: 'finance', roles: ['finance'] },
    'no-role': { id: 'no-role', roles: [] },
    'role-_ops': { id: 'role-_ops', roles: ['_ops'] },
    'role-none': { id: 'role-none', roles: ['none'] },
    technician: { id: 'technician', roles: ['technician'] },
  });
});

test('writeRolesDataSet writes only the no-role user for an app with no auth', async () => {
  writeRolesDataSet({ authJson: { configured: false }, configDirectory });
  const { users } = await parseDataSet({ configDirectory, name: 'roles' });
  expect(users).toEqual({ 'no-role': { id: 'no-role', roles: [] } });
});

test('writeRolesDataSet leaves an existing roles data set alone', () => {
  const filePath = path.join(configDirectory, 'tests', 'data', 'roles.yml');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'users: {}\n');
  expect(
    writeRolesDataSet({ authJson: { roles: [{ id: 'finance' }] }, configDirectory })
  ).toBeUndefined();
  expect(fs.readdirSync(path.dirname(filePath))).toEqual(['roles.yml']);
});
