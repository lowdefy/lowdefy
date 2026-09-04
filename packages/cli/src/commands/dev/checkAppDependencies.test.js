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

import checkAppDependencies from './checkAppDependencies.js';

let root;
let configDirectory;

function writeJson(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

function writeAppPackageJson(dependencies) {
  writeJson(path.join(configDirectory, 'package.json'), { name: 'app', dependencies });
}

function writeFilePlugin() {
  fs.mkdirSync(path.join(configDirectory, 'plugins', 'operators', 'shared'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'plugins', 'operators', 'shared', '_slug.js'),
    'export default () => null;\n'
  );
}

function installPackage({ name, main }) {
  const packageDirectory = path.join(configDirectory, 'node_modules', name);
  writeJson(path.join(packageDirectory, 'package.json'), main ? { name, main } : { name });
  if (main) {
    fs.writeFileSync(path.join(packageDirectory, main), 'module.exports = {};\n');
  }
}

function createContext() {
  return { directories: { config: configDirectory } };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-check-app-dependencies-'));
  configDirectory = path.join(root, 'app');
  fs.mkdirSync(configDirectory, { recursive: true });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('checkAppDependencies passes when every declared dependency is installed', async () => {
  writeFilePlugin();
  writeAppPackageJson({ slugify: '1.6.6' });
  installPackage({ name: 'slugify', main: 'index.js' });
  await expect(checkAppDependencies({ context: createContext() })).resolves.toBeUndefined();
});

test('checkAppDependencies passes when an installed package has no main entry', async () => {
  writeFilePlugin();
  writeAppPackageJson({ 'no-main': '1.0.0' });
  installPackage({ name: 'no-main' });
  await expect(checkAppDependencies({ context: createContext() })).resolves.toBeUndefined();
});

test('checkAppDependencies throws naming every dependency missing from the config directory', async () => {
  writeFilePlugin();
  writeAppPackageJson({ slugify: '1.6.6', stripe: '18.0.0' });
  installPackage({ name: 'slugify', main: 'index.js' });
  await expect(checkAppDependencies({ context: createContext() })).rejects.toThrow(
    /"stripe", which is not installed in the config directory/
  );
});

test('checkAppDependencies error names the app package.json as the file path', async () => {
  writeFilePlugin();
  writeAppPackageJson({ stripe: '18.0.0' });
  await expect(checkAppDependencies({ context: createContext() })).rejects.toMatchObject({
    filePath: path.join(configDirectory, 'package.json'),
  });
});

test('checkAppDependencies passes when the app has no file plugins', async () => {
  writeAppPackageJson({ stripe: '18.0.0' });
  await expect(checkAppDependencies({ context: createContext() })).resolves.toBeUndefined();
});

test('checkAppDependencies passes when the app has no package.json', async () => {
  writeFilePlugin();
  await expect(checkAppDependencies({ context: createContext() })).resolves.toBeUndefined();
});

test('checkAppDependencies passes when the app declares no dependencies', async () => {
  writeFilePlugin();
  writeJson(path.join(configDirectory, 'package.json'), { name: 'app' });
  await expect(checkAppDependencies({ context: createContext() })).resolves.toBeUndefined();
});
