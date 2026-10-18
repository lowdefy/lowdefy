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
import path from 'node:path';

import * as nativeBlocks from '@lowdefy/blocks-native/blocks';
import { Screen } from '@lowdefy/client-native';

import nativeActions from '../actions/nativeActions.js';
import typeManifest from './typeManifest.js';
import types from './types.js';

function createTypeManifest() {
  return JSON.parse(
    execFileSync(process.execPath, [path.join(__dirname, '../../scripts/createTypeManifest.mjs')], {
      encoding: 'utf8',
    })
  );
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
