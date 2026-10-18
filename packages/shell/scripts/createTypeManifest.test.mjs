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

// scripts/createTypeManifest.mjs run on a shell with plugins, as app.config.ts and lowdefy mobile
// config run it: a plugin's native types join the manifest, and a native-only plugin, with no
// `./types` export, adds none.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { printerPlugin, withPrinterPlugin } from '../fixtures/withPrinterPlugin.mjs';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'createTypeManifest.mjs');

const shell = {
  id: 'field',
  name: 'Field',
  profile: 'field',
  version: '1.4.0',
  color: '#0B5FFF',
  scheme: 'field',
  environment: 'production',
  ios: { bundleIdentifier: 'com.example.field' },
  android: { package: 'com.example.field' },
  app: { id: 'field', name: 'Field', urls: { production: 'https://field.example.com' } },
};

// A native-only shell plugin: a device-management SDK wrapper that exports ./shell alone.
function writeNativeOnlyPlugin(directory) {
  const packageDirectory = path.join(directory, 'node_modules', '@example', 'lowdefy-mdm');
  fs.mkdirSync(packageDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(packageDirectory, 'package.json'),
    JSON.stringify({
      name: '@example/lowdefy-mdm',
      version: '1.0.3',
      exports: { './shell': './shell.cjs' },
    })
  );
  fs.writeFileSync(path.join(packageDirectory, 'shell.cjs'), 'module.exports = { plugins: [] };');
}

function runScript({ directory, env, plugins }) {
  const configPath = path.join(directory, 'shell.json');
  fs.writeFileSync(configPath, JSON.stringify({ ...shell, plugins }));
  return JSON.parse(
    execFileSync(process.execPath, [script], {
      encoding: 'utf8',
      env: { ...env, LOWDEFY_SHELL_CONFIG: configPath },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  );
}

test('a native-only shell plugin adds no types, beside a plugin that gives native types', () =>
  withPrinterPlugin(({ directory, env }) => {
    writeNativeOnlyPlugin(directory);
    const manifest = runScript({
      directory,
      env,
      plugins: [
        { ...printerPlugin, typePrefix: 'Printer' },
        { name: '@example/lowdefy-mdm', version: '1.0.3', options: { tenant: 'field-team' } },
      ],
    });
    assert.deepEqual(manifest.blocks.PrinterLabel, {
      package: '@example/lowdefy-printer',
      version: 2,
    });
    assert.deepEqual(manifest.actions.PrinterPrint, {
      package: '@example/lowdefy-printer',
      version: 2,
    });
    const packages = ['actions', 'blocks', 'operators'].flatMap((category) =>
      Object.values(manifest[category]).map((entry) => entry.package)
    );
    assert.ok(!packages.includes('@example/lowdefy-mdm'));
  }));

test('a shell plugin type named like a built-in native type is refused', () =>
  withPrinterPlugin(({ directory, env }) => {
    assert.throws(
      () => runScript({ directory, env, plugins: [printerPlugin] }),
      (error) =>
        error.stderr.includes(
          'Shell plugin "@example/lowdefy-printer" gives the block type "Tag", which "@lowdefy/blocks-native" already gives.'
        )
    );
  }));
