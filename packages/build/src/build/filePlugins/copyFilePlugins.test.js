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

import copyFilePlugins from './copyFilePlugins.js';

let root;
let configDirectory;
let serverDirectory;

function write(relativePath, source) {
  const absolutePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
  return absolutePath;
}

function createContext(stage) {
  return {
    directories: { config: configDirectory, server: serverDirectory },
    filePlugins: [
      {
        kind: 'blocks',
        typeName: 'Badge',
        file: path.join(configDirectory, 'plugins/blocks/Badge.jsx'),
        relativePath: 'plugins/blocks/Badge.jsx',
      },
    ],
    stage,
  };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-copy-file-plugins-'));
  configDirectory = path.join(root, 'app');
  serverDirectory = path.join(root, 'app', '.lowdefy', 'server');
  fs.mkdirSync(serverDirectory, { recursive: true });
  write(
    'plugins/blocks/Badge.jsx',
    "import tone from './lib/tone.js';\nexport default () => tone;\n"
  );
  write('plugins/blocks/lib/tone.js', "export default 'blue';\n");
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('copyFilePlugins copies a file plugin and its relative imports for prod', async () => {
  await copyFilePlugins({ context: createContext('prod') });
  expect(fs.existsSync(path.join(serverDirectory, 'plugins/blocks/Badge.jsx'))).toBe(true);
  expect(fs.existsSync(path.join(serverDirectory, 'plugins/blocks/lib/tone.js'))).toBe(true);
});

test('copyFilePlugins copies nothing in dev, where the barrel imports the file in place', async () => {
  await copyFilePlugins({ context: createContext('dev') });
  expect(fs.existsSync(path.join(serverDirectory, 'plugins'))).toBe(false);
});

test('copyFilePlugins does not follow a relative import outside the config directory', async () => {
  fs.mkdirSync(path.join(root, 'outside'), { recursive: true });
  fs.writeFileSync(path.join(root, 'outside', 'secret.js'), 'export default 1;\n');
  write(
    'plugins/blocks/Badge.jsx',
    "import s from '../../../outside/secret.js';\nexport default () => s;\n"
  );
  await copyFilePlugins({ context: createContext('prod') });
  expect(fs.existsSync(path.join(serverDirectory, 'plugins/blocks/Badge.jsx'))).toBe(true);
  expect(fs.readdirSync(serverDirectory)).toEqual(['plugins']);
});
