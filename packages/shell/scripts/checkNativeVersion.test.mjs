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

// check:native-version fails when the shell's native code changes without a nativeVersion bump.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkNativeVersion } from './checkNativeVersion.mjs';

const shellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SKIPPED_IN_COPY = new Set(['android', 'coverage', 'dist', 'ios', 'node_modules', '.expo']);

// A native module the shell does not depend on: an Expo module with an iOS pod and an Android
// project, which autolinking links once package.json lists it.
const TEST_MODULE = 'lowdefy-test-native-module';

function writeTestModule(directory) {
  fs.mkdirSync(path.join(directory, 'ios'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'android'), { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ name: TEST_MODULE, version: '1.0.0', main: 'index.js' })
  );
  fs.writeFileSync(path.join(directory, 'index.js'), 'module.exports = {};\n');
  fs.writeFileSync(
    path.join(directory, 'expo-module.config.json'),
    JSON.stringify({
      platforms: ['apple', 'android'],
      apple: { modules: ['TestModule'] },
      android: { modules: ['expo.modules.test.TestModule'] },
    })
  );
  fs.writeFileSync(
    path.join(directory, 'ios', 'TestModule.podspec'),
    "Pod::Spec.new do |s|\n  s.name = 'TestModule'\n  s.version = '1.0.0'\nend\n"
  );
  fs.writeFileSync(path.join(directory, 'android', 'build.gradle'), '');
}

// A copy of the shell package whose node_modules links the shell's own, plus the test module.
function copyShell() {
  // The real path: macOS's temporary directory is behind a symlink, and a script app.config.ts runs
  // may compare its own path with the one it was started with.
  const directory = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-shell-native-version-')
  );
  fs.readdirSync(shellRoot)
    .filter((name) => !SKIPPED_IN_COPY.has(name))
    .forEach((name) => {
      fs.cpSync(path.join(shellRoot, name), path.join(directory, name), { recursive: true });
    });
  const nodeModules = path.join(directory, 'node_modules');
  fs.mkdirSync(nodeModules);
  fs.readdirSync(path.join(shellRoot, 'node_modules')).forEach((name) => {
    fs.symlinkSync(path.join(shellRoot, 'node_modules', name), path.join(nodeModules, name));
  });
  writeTestModule(path.join(nodeModules, TEST_MODULE));
  return directory;
}

function updatePackageJson(directory, update) {
  const packageJsonPath = path.join(directory, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  fs.writeFileSync(packageJsonPath, JSON.stringify(update(packageJson), null, 2));
}

test('the shell package matches the fingerprint recorded for its nativeVersion', async () => {
  const { ok, message } = await checkNativeVersion({ shellRoot });
  assert.equal(ok, true, message);
});

test('a native dependency added without a nativeVersion bump fails, and passes after bump and --write', async () => {
  const directory = copyShell();
  try {
    assert.equal((await checkNativeVersion({ shellRoot: directory })).ok, true);

    updatePackageJson(directory, (packageJson) => ({
      ...packageJson,
      dependencies: { ...packageJson.dependencies, [TEST_MODULE]: '1.0.0' },
    }));
    const unbumped = await checkNativeVersion({ shellRoot: directory });
    assert.equal(unbumped.ok, false);
    assert.match(unbumped.message, /native code changed .* but nativeVersion is still 1/);

    const refused = await checkNativeVersion({ shellRoot: directory, write: true });
    assert.equal(refused.ok, false);

    updatePackageJson(directory, (packageJson) => ({ ...packageJson, nativeVersion: 2 }));
    const notWritten = await checkNativeVersion({ shellRoot: directory });
    assert.equal(notWritten.ok, false);
    assert.match(notWritten.message, /records 1. Run .*--write/);

    assert.equal((await checkNativeVersion({ shellRoot: directory, write: true })).ok, true);
    const written = await checkNativeVersion({ shellRoot: directory });
    assert.equal(written.ok, true, written.message);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('a change to a file app.config.ts only reads its config with needs no bump', async () => {
  const directory = copyShell();
  try {
    fs.appendFileSync(path.join(directory, 'checkShellConfig.js'), '\n// A comment.\n');
    const { ok, message } = await checkNativeVersion({ shellRoot: directory });
    assert.equal(ok, true, message);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
