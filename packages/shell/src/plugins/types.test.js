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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as nativeBlocks from '@lowdefy/blocks-native/blocks';
import { Screen } from '@lowdefy/client-native';

import nativeActions from '../actions/nativeActions.js';
import prefixTypes from './prefixTypes.js';
import typeManifest from './typeManifest.js';
import types from './types.js';

const shellRoot = path.join(__dirname, '../..');

function createTypeManifest(env = process.env) {
  return JSON.parse(
    execFileSync(process.execPath, [path.join(shellRoot, 'scripts/createTypeManifest.mjs')], {
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  );
}

// The test shell plugin (fixtures/printer-plugin) installed as `lowdefy mobile config` installs it,
// listed in a shell.json, and the types the shell registers with appTypes.js written for it.
function withPrinterPlugin(plugin, callback) {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-shell-types-'));
  try {
    const nodeModules = path.join(directory, 'node_modules');
    fs.mkdirSync(path.join(nodeModules, '@example'), { recursive: true });
    fs.symlinkSync(
      path.join(shellRoot, 'fixtures/printer-plugin'),
      path.join(nodeModules, '@example/lowdefy-printer'),
      'dir'
    );
    const devShell = JSON.parse(fs.readFileSync(path.join(shellRoot, 'shell.dev.json'), 'utf8'));
    const configPath = path.join(directory, 'shell.json');
    fs.writeFileSync(configPath, JSON.stringify({ ...devShell, plugins: [plugin] }));
    let pluginTypes;
    jest.isolateModules(() => {
      jest.doMock('./appTypes.js', () => {
        const native = jest.requireActual('../../fixtures/printer-plugin/native.js');
        return {
          __esModule: true,
          default: {
            actions: prefixTypes({ types: native.actions, typePrefix: plugin.typePrefix }),
            blocks: prefixTypes({ types: native.blocks, typePrefix: plugin.typePrefix }),
          },
        };
      });
      pluginTypes = require('./types.js').default;
    });
    return callback({
      env: { ...process.env, LOWDEFY_SHELL_CONFIG: configPath, NODE_PATH: nodeModules },
      pluginTypes,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

// The committed manifest the bundle carries must be the one shellPlugins.json and the plugin
// packages make: run `pnpm --filter=@lowdefy/shell type-manifest` after changing either.
test('src/plugins/typeManifest.js matches the manifest made from shellPlugins.json', () => {
  expect(typeManifest).toEqual(createTypeManifest());
});

// The manifest pages are checked against must name exactly the types the shell registers.
test('the type manifest lists every type the shell registers, and no other', () => {
  ['actions', 'blocks', 'operators'].forEach((category) => {
    expect(Object.keys(typeManifest[category]).sort()).toEqual(Object.keys(types[category]).sort());
  });
  expect(typeManifest.blocks.Box).toEqual({ package: '@lowdefy/blocks-native', version: 6 });
  expect(typeManifest.blocks.Screen).toEqual({ package: '@lowdefy/blocks-native', version: 6 });
  expect(typeManifest.blocks.TextInput).toEqual({ package: '@lowdefy/blocks-native', version: 6 });
  expect(typeManifest.blocks.Markdown).toEqual({ package: '@lowdefy/blocks-native', version: 6 });
  expect(typeManifest.actions.SetState.package).toBe('@lowdefy/actions-core');
  expect(typeManifest.operators._state.package).toBe('@lowdefy/operators-js');
});

// The build's mobile type map allows the client operators of every default operator package.
test('the shell registers the client operators of every default operator package', () => {
  [
    ['_change_case', 'change-case'],
    ['_cron', 'cron'],
    ['_dayjs', 'dayjs'],
    ['_diff', 'diff'],
    ['_jsonata', 'jsonata'],
    ['_mql', 'mql'],
    ['_nunjucks', 'nunjucks'],
    ['_uuid', 'uuid'],
    ['_yaml', 'yaml'],
  ].forEach(([operator, name]) => {
    expect(typeof types.operators[operator]).toBe('function');
    expect(typeManifest.operators[operator].package).toBe(`@lowdefy/operators-${name}`);
  });
});

test("the shell renders the whole native block set, with the native renderer's Screen", () => {
  expect(Object.keys(types.blocks).sort()).toEqual([...Object.keys(nativeBlocks), 'Screen'].sort());
  expect(types.blocks.Screen).toBe(Screen);
  expect(types.blocks.Box).toBe(nativeBlocks.Box);
});

test('the DOM-bound actions-core actions run their native bodies under the same names', () => {
  expect(types.actions.SetFocus).toBe(nativeActions.SetFocus);
  expect(types.actions.ScrollTo).toBe(nativeActions.ScrollTo);
  expect(types.actions.CopyToClipboard).toBe(nativeActions.CopyToClipboard);
  expect(types.actions.GetLocalStorage).toBe(nativeActions.GetLocalStorage);
  expect(types.actions.SetLocalStorage).toBe(nativeActions.SetLocalStorage);
  expect(types.actions.RemoveLocalStorage).toBe(nativeActions.RemoveLocalStorage);
  expect(types.actions.SetState).not.toBeUndefined();
});

test("a shell plugin's native types register and join the manifest, named with its typePrefix", () => {
  withPrinterPlugin(
    { name: '@example/lowdefy-printer', version: '2.1.0', typePrefix: 'Printer' },
    ({ env, pluginTypes }) => {
      const manifest = createTypeManifest(env);
      ['actions', 'blocks', 'operators'].forEach((category) => {
        expect(Object.keys(manifest[category]).sort()).toEqual(
          Object.keys(pluginTypes[category]).sort()
        );
      });
      const printer = { package: '@example/lowdefy-printer', version: 2 };
      expect(manifest.blocks.PrinterLabel).toEqual(printer);
      expect(manifest.blocks.PrinterTag).toEqual(printer);
      expect(manifest.actions.PrinterPrint).toEqual(printer);
      expect(manifest.blocks.Label).toBeUndefined();
      expect(manifest.blocks.Tag).toEqual({ package: '@lowdefy/blocks-native', version: 6 });
      // The registry jest.isolateModules loads them in is its own, so they are compared by what
      // they do: the plugin's Label under its prefixed name, the built-in Tag kept.
      expect(
        pluginTypes.blocks.PrinterLabel({ blockId: 'label', properties: { text: 'A1' } })
      ).toEqual({ type: 'PrinterLabel', blockId: 'label', text: 'A1' });
      expect(pluginTypes.actions.PrinterPrint({ params: { text: 'A1' } })).toEqual({
        printed: 'A1',
      });
      expect(pluginTypes.blocks.Tag.meta).toEqual(nativeBlocks.Tag.meta);
    }
  );
});

test('a shell plugin type named like a built-in one fails the manifest: use typePrefix', () => {
  withPrinterPlugin({ name: '@example/lowdefy-printer', version: '2.1.0' }, ({ env }) => {
    expect(() => createTypeManifest(env)).toThrow(
      'Shell plugin "@example/lowdefy-printer" gives the block type "Tag", which "@lowdefy/blocks-native" already gives. Set a typePrefix on the plugin in mobile.shells[].plugins.'
    );
  });
});

test('appTypes.js ships empty, so a shell without plugins registers only the built-in types', () => {
  const appTypes = jest.requireActual('./appTypes.js').default;
  expect(appTypes).toEqual({ actions: {}, blocks: {} });
});
