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
import path from 'path';

import setupTestFixtures from './setupTestFixtures.mjs';

// lib/build/config.js reads build/config.json from process.cwd() at import
// time, so the fixture carries the basePath before getOverview is imported.
const fixtureDir = setupTestFixtures();
fs.writeFileSync(path.join(fixtureDir, 'build/config.json'), JSON.stringify({ basePath: '/app' }));
process.chdir(fixtureDir);

const { default: getOverview } = await import('./getOverview.js');

test('getOverview tells agents the docs routes are served under the app basePath', () => {
  const overview = getOverview();

  expect(overview).toContain(
    'This app sets `config.basePath: /app`, so every route below is served under it: `GET /app/lowdefy-docs`, `/app/lowdefy-docs/mcp`, `/app/api/...`.'
  );
});
