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
import { jest } from '@jest/globals';

// A budget one page build passes, so the next request recreates the context.
jest.unstable_mockModule('./contextMapBudget.js', () => ({ default: 1 }));

const { default: buildPageIfNeeded, getBuildContext } = await import('./jitPageBuilder.js');

jest.setTimeout(30000);

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

test('a build context past its map budget is recreated, and every page rebuilds on the new one', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-context-budget-'));
  const buildDirectory = path.join(root, 'server', 'build');
  const configDirectory = path.join(root, 'config');
  writeJson(path.join(buildDirectory, 'idCounter.json'), { prefix: 'cfg1_', counter: 10 });
  writeJson(path.join(buildDirectory, 'installedPluginPackages.json'), ['@lowdefy/blocks-basic']);
  writeJson(path.join(buildDirectory, 'theme.json'), {});
  const registry = {};
  for (const pageId of ['a', 'b']) {
    fs.mkdirSync(path.join(configDirectory, 'pages'), { recursive: true });
    fs.writeFileSync(
      path.join(configDirectory, 'pages', `${pageId}.yaml`),
      `id: ${pageId}\ntype: Box\n`
    );
    registry[pageId] = {
      pageId,
      auth: { public: true },
      refId: `ref-${pageId}`,
      refPath: `pages/${pageId}.yaml`,
    };
  }
  writeJson(path.join(buildDirectory, 'pageRegistry.json'), registry);
  const request = (pageId) => buildPageIfNeeded({ pageId, buildDirectory, configDirectory });

  expect(await request('a')).toEqual({ built: true, warnings: undefined });
  const firstContext = getBuildContext(buildDirectory, configDirectory);
  expect(await request('b')).toEqual({ built: true, warnings: undefined });
  const secondContext = getBuildContext(buildDirectory, configDirectory);
  expect(secondContext).not.toBe(firstContext);

  // b was built past the budget too, so the next request recreates again and
  // a, built two contexts ago, rebuilds.
  expect(await request('a')).toEqual({ built: true, warnings: undefined });
  expect(getBuildContext(buildDirectory, configDirectory)).not.toBe(secondContext);
  fs.rmSync(root, { recursive: true, force: true });
});
