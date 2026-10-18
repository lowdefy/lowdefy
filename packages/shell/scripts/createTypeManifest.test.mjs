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

import assert from 'node:assert/strict';
import test from 'node:test';

import createTypeManifest from './createTypeManifest.mjs';

// A type the shell's plugin list gains reaches the manifest, which the bundle carries
// (src/plugins/typeManifest.js); the Expo config plays no part.
test('a block type added to the shell plugins shows up in the type manifest', async () => {
  const before = await createTypeManifest({
    plugins: [{ category: 'blocks', package: '@lowdefy/blocks-native', types: ['Screen'] }],
  });
  assert.deepEqual(Object.keys(before.blocks), ['Screen']);
  const after = await createTypeManifest({
    plugins: [
      { category: 'blocks', package: '@lowdefy/blocks-native', types: ['Screen', 'Markdown'] },
    ],
  });
  assert.deepEqual(Object.keys(after.blocks), ['Screen', 'Markdown']);
  assert.deepEqual(after.blocks.Markdown, after.blocks.Screen);
  assert.equal(after.blocks.Markdown.package, '@lowdefy/blocks-native');
});

test('a type the plugin package does not have is refused', async () => {
  await assert.rejects(
    createTypeManifest({
      plugins: [{ category: 'blocks', package: '@lowdefy/blocks-native', types: ['NoSuchBlock'] }],
    }),
    /Shell plugin "@lowdefy\/blocks-native" has no blocks type "NoSuchBlock"\./
  );
});
