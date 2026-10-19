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

import generateManifest from './generateManifest.js';

let buildDir;

beforeEach(() => {
  buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-e2e-manifest-'));
  fs.writeFileSync(path.join(buildDir, 'types.json'), JSON.stringify({ blocks: {} }));
  fs.writeFileSync(
    path.join(buildDir, 'routes.json'),
    JSON.stringify([
      { pageId: 'home', path: 'home' },
      { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' },
    ])
  );
});

afterEach(() => {
  fs.rmSync(buildDir, { recursive: true, force: true });
});

test('generateManifest records the basePath from config.json and the path of each page with a pattern', () => {
  fs.writeFileSync(path.join(buildDir, 'config.json'), JSON.stringify({ basePath: '/app' }));
  const manifest = generateManifest({ buildDir });
  expect(manifest.basePath).toBe('/app');
  expect(manifest.paths).toEqual({ ticket: 'tickets/{space}/{ticket_id}' });
});

test('generateManifest records an empty basePath for an app served at the root', () => {
  fs.writeFileSync(path.join(buildDir, 'config.json'), JSON.stringify({}));
  expect(generateManifest({ buildDir }).basePath).toBe('');
});
