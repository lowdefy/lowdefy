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

// A shell's runtime version, and the app config app.config.ts builds around it.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const getRuntimeVersion = require('./runtimeVersion.js');
const shellPackage = require('./package.json');

const shellRoot = path.dirname(fileURLToPath(import.meta.url));

test('the runtime version is nativeVersion and profile', () => {
  assert.equal(getRuntimeVersion({ nativeVersion: 3, profile: 'field' }), '3-field');
  assert.equal(getRuntimeVersion({ nativeVersion: 3, profile: 'field', plugins: [] }), '3-field');
});

test('the module names getRuntimeVersion too', () => {
  assert.equal(require('./runtimeVersion.js').getRuntimeVersion, getRuntimeVersion);
});

test('shell plugins add a short hash that does not change with their order', () => {
  const plugins = [
    { name: '@acme/blocks-map', version: '1.2.0' },
    { name: '@acme/actions-scan', version: '2.0.1' },
  ];
  const runtimeVersion = getRuntimeVersion({ nativeVersion: 3, profile: 'field', plugins });
  assert.match(runtimeVersion, /^3-field-[0-9a-f]{8}$/);
  assert.equal(
    getRuntimeVersion({ nativeVersion: 3, profile: 'field', plugins: [...plugins].reverse() }),
    runtimeVersion
  );
  assert.notEqual(
    getRuntimeVersion({
      nativeVersion: 3,
      profile: 'field',
      plugins: [plugins[0], { ...plugins[1], version: '2.0.2' }],
    }),
    runtimeVersion
  );
});

test('a nativeVersion that is not a positive integer is refused', () => {
  assert.throws(
    () => getRuntimeVersion({ nativeVersion: '3', profile: 'field' }),
    /^Error: nativeVersion should be a positive integer. Received "3".$/
  );
  assert.throws(() => getRuntimeVersion({ nativeVersion: 0, profile: 'field' }), /positive/);
});

test('a plugin without a name and version is refused', () => {
  assert.throws(
    () => getRuntimeVersion({ nativeVersion: 1, profile: 'field', plugins: [{ name: 'x' }] }),
    /Each shell plugin should be \{ name, version \}/
  );
});

test('the shell package declares nativeVersion', () => {
  assert.ok(Number.isInteger(shellPackage.nativeVersion) && shellPackage.nativeVersion > 0);
});

// The app config of a shell config, as `expo config` prints it.
function readAppConfig(shell) {
  const directory = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-shell-config-')
  );
  try {
    const configPath = path.join(directory, 'shell.json');
    fs.writeFileSync(configPath, JSON.stringify(shell));
    const output = execFileSync(
      path.join(shellRoot, 'node_modules', '.bin', 'expo'),
      ['config', '--type', 'public', '--json'],
      {
        cwd: shellRoot,
        encoding: 'utf8',
        env: { ...process.env, LOWDEFY_SHELL_CONFIG: configPath, LOWDEFY_SHELL_VARIANT: 'release' },
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    return JSON.parse(output);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const fieldShell = {
  id: 'field',
  name: 'Field',
  profile: 'field',
  version: '1.4.2',
  scheme: 'field',
  environment: 'production',
  eas: { owner: 'example', projectId: '2b6f0000-0000-4000-8000-000000000000' },
  ios: { bundleIdentifier: 'com.example.field' },
  android: { package: 'com.example.field' },
  app: { id: 'field', name: 'Field', urls: { production: 'https://field.example.com' } },
};

test('a store shell sets its runtime version, store version and EAS project', () => {
  const config = readAppConfig(fieldShell);
  assert.equal(config.runtimeVersion, `${shellPackage.nativeVersion}-field`);
  assert.equal(config.version, '1.4.2');
  assert.equal(config.extra.shell.version, shellPackage.version);
  assert.equal(config.owner, 'example');
  assert.deepEqual(config.updates, {
    url: 'https://u.expo.dev/2b6f0000-0000-4000-8000-000000000000',
  });
  assert.deepEqual(config.extra.eas, { projectId: '2b6f0000-0000-4000-8000-000000000000' });
});

test('shells that differ only in identity share a runtime version', () => {
  const other = {
    ...fieldShell,
    id: 'site',
    name: 'Site',
    scheme: 'site',
    eas: { owner: 'other', projectId: '9c1d0000-0000-4000-8000-000000000000' },
    ios: { bundleIdentifier: 'com.other.site' },
    android: { package: 'com.other.site' },
    app: { id: 'site', name: 'Site', urls: { production: 'https://site.example.org' } },
  };
  assert.equal(readAppConfig(other).runtimeVersion, readAppConfig(fieldShell).runtimeVersion);
});
