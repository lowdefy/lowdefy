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

// A shell's plugins load from the shell project, with their config plugins made from their options.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

import { printerPlugin, withPrinterPlugin } from './fixtures/withPrinterPlugin.mjs';

const require = createRequire(import.meta.url);
const resolveShellPlugins = require('./resolveShellPlugins.js');

test('a shell without plugins resolves none', () => {
  assert.deepEqual(resolveShellPlugins({ shell: {}, require }), []);
  assert.deepEqual(resolveShellPlugins({ shell: { plugins: [] }, require }), []);
});

test("a shell plugin's ./shell entry loads, with config plugins made from its options", () =>
  withPrinterPlugin(({ require: shellRequire }) => {
    const [plugin] = resolveShellPlugins({
      shell: {
        plugins: [{ ...printerPlugin, typePrefix: 'Printer', options: { tenant: 'field-team' } }],
      },
      require: shellRequire,
    });
    assert.equal(plugin.name, '@example/lowdefy-printer');
    assert.equal(plugin.version, '2.1.0');
    assert.equal(plugin.typePrefix, 'Printer');
    assert.deepEqual(plugin.options, { tenant: 'field-team' });
    assert.deepEqual(plugin.entry.modules, { 'react-native-ble-plx': 'BlePlx' });
    assert.equal(plugin.entry.plugins.length, 1);
    assert.equal(typeof plugin.entry.plugins[0][0], 'function');
    assert.deepEqual(plugin.entry.plugins[0][1], { bluetoothText: 'Print labels for field-team.' });
  }));

test('a plugins function gets {} when the shell gives the plugin no options', () =>
  withPrinterPlugin(({ require: shellRequire }) => {
    const [plugin] = resolveShellPlugins({
      shell: { plugins: [printerPlugin] },
      require: shellRequire,
    });
    assert.deepEqual(plugin.entry.plugins[0][1], { bluetoothText: 'Print labels for the app.' });
  }));

test('a package without a ./shell export is refused, naming the package', () =>
  withPrinterPlugin(({ directory, require: shellRequire }) => {
    const packageDir = path.join(directory, 'node_modules', '@example', 'no-shell');
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, 'package.json'),
      JSON.stringify({
        name: '@example/no-shell',
        version: '1.0.0',
        exports: { './types': './types.js' },
      })
    );
    assert.throws(
      () =>
        resolveShellPlugins({
          shell: { plugins: [{ name: '@example/no-shell', version: '1.0.0' }] },
          require: shellRequire,
        }),
      /^Error: Shell plugin "@example\/no-shell" could not be loaded from "@example\/no-shell\/shell"\. A shell plugin exports "\.\/shell"/
    );
  }));

test('a plugin that is not installed is refused, naming the package', () => {
  assert.throws(
    () =>
      resolveShellPlugins({
        shell: { plugins: [{ name: '@example/not-installed', version: '1.0.0' }] },
        require,
      }),
    /Shell plugin "@example\/not-installed" could not be loaded/
  );
});

test('a ./shell entry of the wrong shape is refused, naming the package and key', () => {
  const shell = { plugins: [{ name: '@example/odd', version: '1.0.0' }] };
  assert.throws(
    () => resolveShellPlugins({ shell, require: () => ({ plugins: [], permissions: 'camera' }) }),
    /^Error: Shell plugin "@example\/odd" "\.\/shell" "permissions" should be an array. Received "camera".$/
  );
  assert.throws(
    () => resolveShellPlugins({ shell, require: () => ({ plugins: [], modules: ['x'] }) }),
    /"modules" should be \{ \[package\]: nativeModuleName \}/
  );
  assert.throws(
    () => resolveShellPlugins({ shell, require: () => ({ plugins: () => 'expo-camera' }) }),
    /"plugins" should be an array of config plugin entries/
  );
  assert.throws(
    () => resolveShellPlugins({ shell, require: () => 'entry' }),
    /^Error: Shell plugin "@example\/odd" "\.\/shell" should export an object. Received "entry".$/
  );
});
