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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, expect, test } from 'vitest';

import createDevServerFsAllow from './createDevServerFsAllow.js';

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-fs-allow-')));

function makeWorkspace(name) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(path.join(dir, 'packages', 'plugin'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages: []\n');
  return dir;
}

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('createDevServerFsAllow allows only the server workspace when nothing is linked', () => {
  const server = makeWorkspace('server-plain');
  expect(
    createDevServerFsAllow({ dependencies: { '@lowdefy/blocks-qr': '8.0.0' }, root: server })
  ).toEqual([server]);
});

test('createDevServerFsAllow also allows the workspace of each linked package, once', () => {
  const server = makeWorkspace('server-linked');
  const checkout = makeWorkspace('checkout');
  const dependencies = {
    '@lowdefy/blocks-qr': `link:${path.relative(server, path.join(checkout, 'packages/plugin'))}`,
    '@lowdefy/helpers': `link:${path.join(checkout, 'packages/plugin')}`,
    react: '19.3.1',
  };
  expect(createDevServerFsAllow({ dependencies, root: server })).toEqual([server, checkout]);
});
