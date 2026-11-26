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

import checkAccessTable from './checkAccessTable.js';

const row = { finance: 'allow', 'no-role': 'deny', none: 'deny' };
const built = { pages: { billing: row }, endpoints: { approve: row } };

let configDirectory;
let logs;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-check-access-'));
  logs = { info: [], warn: [], error: [] };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function makeContext({ configured = true, typedOptions = [] } = {}) {
  const server = path.join(configDirectory, 'dist', 'server');
  const build = path.join(server, 'build');
  fs.mkdirSync(build, { recursive: true });
  fs.writeFileSync(
    path.join(build, 'auth.json'),
    JSON.stringify({ configured, roles: [], pages: { roles: {} }, api: { roles: {} } })
  );
  return {
    directories: { config: configDirectory, server, build },
    options: { typedOptions },
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
    },
  };
}

function makeApp(table = built) {
  const calls = [];
  return {
    calls,
    accessMatrix: async ({ data }) => {
      calls.push(data);
      return table;
    },
  };
}

function writeFile(content) {
  fs.mkdirSync(path.join(configDirectory, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'tests', 'access.yaml'), content);
}

const committed = [
  'data: roles',
  'pages:',
  '  billing: { finance: allow, no-role: deny, none: deny }',
  'endpoints:',
  '  approve: { finance: allow, no-role: deny, none: deny }',
  '',
].join('\n');

test('checkAccessTable passes when the build matches the committed file, checked as its data set', async () => {
  writeFile(committed);
  const app = makeApp();
  const result = await checkAccessTable({ app, context: makeContext(), required: false });
  expect(result).toEqual({ failed: false });
  expect(app.calls).toEqual(['roles']);
  expect(logs.info).toEqual(['PASS  access table  (1 pages, 1 endpoints)']);
});

test('checkAccessTable fails with one line per changed cell and the command that accepts them', async () => {
  writeFile(committed);
  const app = makeApp({ ...built, endpoints: { approve: { ...row, 'no-role': 'allow' } } });
  const result = await checkAccessTable({ app, context: makeContext(), required: false });
  expect(result).toEqual({ failed: true });
  const relative = path.relative(process.cwd(), configDirectory);
  const directory = relative.startsWith('..') ? configDirectory : relative;
  expect(logs.error[0]).toBe('FAIL  access table: tests/access.yaml differs from the build');
  expect(logs.error[1]).toBe('      endpoints.approve.no-role: deny → allow');
  expect(logs.error[2]).toBe(
    `      If these changes are meant, run "lowdefy test --update-access --config-directory ${directory}" and commit tests/access.yaml.`
  );
});

test('checkAccessTable passes a typed --server-directory on in the command that accepts a change', async () => {
  writeFile(committed);
  const app = makeApp({ ...built, pages: {} });
  await checkAccessTable({
    app,
    context: makeContext({ typedOptions: ['serverDirectory'] }),
    required: false,
  });
  expect(logs.error.at(-1)).toMatch(/--server-directory \S*dist[\\/]server" and commit/);
});

test('checkAccessTable warns an app with auth and no file with the first-file command', async () => {
  const app = makeApp();
  const result = await checkAccessTable({ app, context: makeContext(), required: false });
  expect(result).toEqual({ failed: false });
  expect(app.calls).toEqual([]);
  expect(logs.warn).toHaveLength(1);
  expect(logs.warn[0]).toMatch(
    /^This app has auth and no tests\/access\.yaml, so who reaches which page and endpoint is not checked\. Write it with "lowdefy build --no-client-build .* && lowdefy test --update-access .*", then commit the files it writes\.$/
  );
});

test('checkAccessTable says nothing for an app with no auth and no file', async () => {
  const result = await checkAccessTable({
    app: makeApp(),
    context: makeContext({ configured: false }),
    required: false,
  });
  expect(result).toEqual({ failed: false });
  expect(logs).toEqual({ info: [], warn: [], error: [] });
});

test('checkAccessTable fails --access with no file, with the first-file command', async () => {
  const result = await checkAccessTable({
    app: makeApp(),
    context: makeContext({ configured: false }),
    required: true,
  });
  expect(result).toEqual({ failed: true });
  expect(logs.error[0]).toMatch(/^No tests\/access\.yaml to check\. Write it with "lowdefy build/);
});

test('checkAccessTable fails when the data set the file names can not be read', async () => {
  writeFile(committed);
  const app = {
    accessMatrix: async () => {
      throw new Error('Data set "roles" not found.');
    },
  };
  const result = await checkAccessTable({ app, context: makeContext(), required: false });
  expect(result).toEqual({ failed: true });
  expect(logs.error).toEqual(['FAIL  access table: Data set "roles" not found.']);
});

test('checkAccessTable fails on a file it can not read as an access table', async () => {
  writeFile('pages: {}\n');
  const result = await checkAccessTable({
    app: makeApp(),
    context: makeContext(),
    required: false,
  });
  expect(result).toEqual({ failed: true });
  expect(logs.error[0]).toMatch(/^FAIL {2}access table: tests\/access\.yaml "data" should be/);
});
