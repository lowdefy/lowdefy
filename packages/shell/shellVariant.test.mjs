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

// Which native modules a shell leaves unlinked. scripts/checkReleaseBundle.mjs checks a real
// prebuild against the same list.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { getExcludedModules, getShellVariant, shellNeedsCamera } = require('./shellVariant.js');

test('Lowdefy Dev links every module it uses', () => {
  assert.deepEqual(getExcludedModules({ shell: { profile: 'dev' }, variant: 'dev' }), {});
});

test('a release shell leaves out the dev-only modules and the camera it does not need', () => {
  assert.deepEqual(Object.keys(getExcludedModules({ shell: {}, variant: 'release' })), [
    'expo-sensors',
    'react-native-view-shot',
    'expo-camera',
  ]);
});

test('a release shell that needs the camera keeps expo-camera', () => {
  const shell = { capabilities: ['camera', 'location'] };
  assert.equal(shellNeedsCamera(shell), true);
  assert.deepEqual(Object.keys(getExcludedModules({ shell, variant: 'release' })), [
    'expo-sensors',
    'react-native-view-shot',
  ]);
});

test('the variant is dev for Lowdefy Dev and release for a shell config, unless set', () => {
  assert.equal(getShellVariant({}), 'dev');
  assert.equal(getShellVariant({ LOWDEFY_SHELL_CONFIG: 'shell.json' }), 'release');
  assert.equal(getShellVariant({ LOWDEFY_SHELL_VARIANT: 'dev', LOWDEFY_SHELL_CONFIG: 'x' }), 'dev');
  assert.throws(
    () => getShellVariant({ LOWDEFY_SHELL_VARIANT: 'store' }),
    /LOWDEFY_SHELL_VARIANT must be "dev" or "release". Received "store"./
  );
});
