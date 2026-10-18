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

import { getBuildContext } from './jitPageBuilder.js';

// Mobile pages built on request resolve shell plugin native types as the
// skeleton build did, from the customTypesMapMobile.json it wrote.
test('getBuildContext restores the shell plugin native types into the mobile types map', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-jit-context-'));
  const buildDirectory = path.join(root, 'build');
  fs.mkdirSync(buildDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(buildDirectory, 'idCounter.json'),
    JSON.stringify({ prefix: 'test_', counter: 0 })
  );
  const printerLabel = {
    package: '@example/lowdefy-printer',
    originalTypeName: 'Label',
    version: '2.1.0',
  };
  fs.writeFileSync(
    path.join(buildDirectory, 'customTypesMapMobile.json'),
    JSON.stringify({
      actions: {},
      blockMetas: { PrinterLabel: { category: 'display' } },
      blocks: { PrinterLabel: printerLabel },
      icons: {},
      operators: { client: {} },
      plugins: ['@example/lowdefy-printer'],
    })
  );

  const context = getBuildContext(buildDirectory, path.join(root, 'config'));

  expect(context.typesMapMobile.blocks.PrinterLabel).toEqual(printerLabel);
  expect(context.typesMapMobile.blocks.Box.package).toEqual('@lowdefy/blocks-native');
  expect(context.blockMetasMobile.PrinterLabel).toEqual({ category: 'display' });
  expect(context.typesMapMobile.plugins).toEqual(['@example/lowdefy-printer']);
});
