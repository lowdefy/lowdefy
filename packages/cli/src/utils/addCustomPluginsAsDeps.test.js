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

import addCustomPluginsAsDeps from './addCustomPluginsAsDeps.js';

let root;
let configDirectory;
let serverDirectory;

function writeJson(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

function readServerDependencies() {
  return JSON.parse(fs.readFileSync(path.join(serverDirectory, 'package.json'), 'utf8'))
    .dependencies;
}

function createContext(plugins = {}) {
  return { directories: { config: configDirectory, server: serverDirectory }, plugins };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-add-custom-plugins-'));
  configDirectory = path.join(root, 'app');
  serverDirectory = path.join(root, 'app', '.lowdefy', 'server');
  writeJson(path.join(serverDirectory, 'package.json'), {
    name: '@lowdefy/server',
    dependencies: { react: '19.0.0' },
  });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('addCustomPluginsAsDeps writes the declared plugin packages', async () => {
  fs.mkdirSync(configDirectory, { recursive: true });
  await addCustomPluginsAsDeps({
    context: createContext({ '@acme/plugins': { name: '@acme/plugins', version: '1.2.3' } }),
    directory: serverDirectory,
  });
  expect(readServerDependencies()).toEqual({ '@acme/plugins': '1.2.3', react: '19.0.0' });
});

test('addCustomPluginsAsDeps merges the app dependencies when the app has file plugins', async () => {
  fs.mkdirSync(path.join(configDirectory, 'plugins', 'actions'), { recursive: true });
  writeJson(path.join(configDirectory, 'package.json'), {
    name: 'my-app',
    dependencies: { stripe: '18.0.0' },
    devDependencies: { jest: '30.0.0' },
  });
  await addCustomPluginsAsDeps({ context: createContext(), directory: serverDirectory });
  expect(readServerDependencies()).toEqual({ react: '19.0.0', stripe: '18.0.0' });
});

test('addCustomPluginsAsDeps keeps the server version of a dependency the app also declares', async () => {
  fs.mkdirSync(path.join(configDirectory, 'plugins', 'blocks'), { recursive: true });
  writeJson(path.join(configDirectory, 'package.json'), {
    name: 'my-app',
    dependencies: { react: '18.0.0' },
  });
  await addCustomPluginsAsDeps({ context: createContext(), directory: serverDirectory });
  expect(readServerDependencies()).toEqual({ react: '19.0.0' });
});

test('addCustomPluginsAsDeps leaves the app dependencies out when there are no file plugins', async () => {
  fs.mkdirSync(configDirectory, { recursive: true });
  writeJson(path.join(configDirectory, 'package.json'), {
    name: 'my-app',
    dependencies: { stripe: '18.0.0' },
  });
  await addCustomPluginsAsDeps({ context: createContext(), directory: serverDirectory });
  expect(readServerDependencies()).toEqual({ react: '19.0.0' });
});

test('addCustomPluginsAsDeps sorts the dependencies', async () => {
  fs.mkdirSync(path.join(configDirectory, 'plugins', 'operators'), { recursive: true });
  writeJson(path.join(configDirectory, 'package.json'), {
    name: 'my-app',
    dependencies: { stripe: '18.0.0', axios: '1.0.0' },
  });
  await addCustomPluginsAsDeps({ context: createContext(), directory: serverDirectory });
  expect(Object.keys(readServerDependencies())).toEqual(['axios', 'react', 'stripe']);
});

test('addCustomPluginsAsDeps merges app dependencies when the only file plugin is a connection', async () => {
  fs.mkdirSync(path.join(configDirectory, 'plugins', 'connections'), { recursive: true });
  writeJson(path.join(configDirectory, 'package.json'), {
    name: 'my-app',
    dependencies: { ioredis: '5.0.0' },
  });
  await addCustomPluginsAsDeps({ context: createContext(), directory: serverDirectory });
  expect(readServerDependencies()).toEqual({ ioredis: '5.0.0', react: '19.0.0' });
});
