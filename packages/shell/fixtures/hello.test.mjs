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

// Builds the hello fixture app with the Lowdefy build and checks what a shell would sync: two tabs,
// the Screen page and every page's type set carried by this shell's type manifest.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import build from '@lowdefy/build';
import { createNodeLogger } from '@lowdefy/logger/node';

import createTypeManifest from '../scripts/createTypeManifest.mjs';

const configDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'hello');

function checkTypeSet({ manifest, typeSet }) {
  return ['actions', 'blocks', 'operators'].flatMap((category) =>
    (typeSet[category] ?? []).filter((needed) => {
      const carried = manifest[category][needed.type];
      return carried?.package !== needed.package || carried?.version !== needed.version;
    })
  );
}

test('the hello fixture builds into two tabs whose pages this shell renders', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shell-hello-'));
  const buildDirectory = path.join(directory, 'build');
  const serverDirectory = path.join(directory, 'server');
  // The parts of a server folder the build writes into: its package.json (the app's plugin
  // packages) and its default public files.
  fs.mkdirSync(path.join(serverDirectory, 'public_default'), { recursive: true });
  fs.writeFileSync(
    path.join(serverDirectory, 'package.json'),
    JSON.stringify({ dependencies: {} })
  );
  try {
    await build({
      directories: {
        config: configDirectory,
        build: buildDirectory,
        server: serverDirectory,
      },
      logger: createNodeLogger({ level: 'error' }),
      stage: 'prod',
    });
    const readArtifact = (file) =>
      JSON.parse(fs.readFileSync(path.join(buildDirectory, file), 'utf8'));
    const config = readArtifact('mobile/config.json');
    const pageIndex = readArtifact('mobile/pageIndex.json');
    const typeSets = readArtifact('mobile/typeSets.json');
    assert.deepEqual(
      config.menus.tabs.map((item) => item.pageId),
      ['today', 'about']
    );
    assert.equal(config.homePageId, 'today');
    assert.deepEqual(
      pageIndex.map((entry) => entry.pageId),
      ['today', 'about']
    );
    assert.equal(readArtifact('pages/today.json').type, 'Screen');
    assert.deepEqual(
      typeSets[pageIndex[0].typesKey].blocks.map((needed) => needed.type),
      ['Box', 'Screen']
    );
    assert.deepEqual(
      typeSets[pageIndex[0].typesKey].actions.map((needed) => needed.type),
      ['SetState']
    );
    const manifest = await createTypeManifest();
    pageIndex.forEach((entry) => {
      assert.deepEqual(checkTypeSet({ manifest, typeSet: typeSets[entry.typesKey] }), []);
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
