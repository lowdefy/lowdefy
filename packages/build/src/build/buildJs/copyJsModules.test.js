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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

const mockCopy = jest.fn(() => Promise.resolve());
jest.unstable_mockModule('@lowdefy/node-utils', () => ({ copyFileOrDirectory: mockCopy }));

const { default: copyJsModules } = await import('./copyJsModules.js');

let config;

function write(relativePath, source) {
  const absolutePath = path.join(config, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
  return absolutePath;
}

function createContext({ stage, server = '/srv', modules }) {
  return {
    stage,
    directories: { config, server },
    jsModules: modules,
  };
}

beforeEach(() => {
  mockCopy.mockClear();
  config = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-copy-js-modules-'));
});

afterEach(() => {
  fs.rmSync(config, { recursive: true, force: true });
});

test('copyJsModules copies each referenced file once, with the closure of its relative imports', async () => {
  const rows = write(
    'pages/lib/rows.js',
    "import { esc } from './esc.js';\nexport * from '../../lib/shared.js';\nexport const a = 1;"
  );
  write('pages/lib/esc.js', "import { deep } from './deep/x.js';\nexport const esc = 1;");
  write('pages/lib/deep/x.js', "import lodash from 'lodash';\nexport const deep = 1;");
  write('lib/shared.js', "import { esc } from '../pages/lib/esc.js';\nexport const shared = 1;");
  const url = write('lib/url.js', "import './missing.js';\nexport default 1;");

  await copyJsModules({
    context: createContext({
      stage: 'prod',
      modules: {
        client: { H1: { absolutePath: rows, relativePath: 'pages/lib/rows.js' } },
        server: {
          H2: { absolutePath: rows, relativePath: 'pages/lib/rows.js' },
          H3: { absolutePath: url, relativePath: 'lib/url.js' },
        },
      },
    }),
  });

  expect(mockCopy.mock.calls.map(([from, to]) => [path.relative(config, from), to])).toEqual([
    ['lib/shared.js', '/srv/lib/shared.js'],
    ['lib/url.js', '/srv/lib/url.js'],
    ['pages/lib/deep/x.js', '/srv/pages/lib/deep/x.js'],
    ['pages/lib/esc.js', '/srv/pages/lib/esc.js'],
    ['pages/lib/rows.js', '/srv/pages/lib/rows.js'],
  ]);
});

test('copyJsModules does nothing in dev', async () => {
  const rows = write('lib/x.js', 'export const a = 1;');
  const modules = { client: { H1: { absolutePath: rows, relativePath: 'lib/x.js' } }, server: {} };
  await copyJsModules({ context: createContext({ stage: 'dev', modules }) });
  expect(mockCopy).not.toHaveBeenCalled();
});

test('copyJsModules does nothing when the config directory is the server directory', async () => {
  const rows = write('lib/x.js', 'export const a = 1;');
  const modules = { client: { H1: { absolutePath: rows, relativePath: 'lib/x.js' } }, server: {} };
  await copyJsModules({ context: createContext({ stage: 'prod', server: config, modules }) });
  expect(mockCopy).not.toHaveBeenCalled();
});
