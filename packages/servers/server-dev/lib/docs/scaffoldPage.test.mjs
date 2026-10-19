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

import scaffoldPage from './scaffoldPage.js';

let configDirectory;
let previousConfigDirectory;
let previousCwd;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scaffold-page-test-'));
  previousConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
  // readBuildArtifact.js (used to check pageRegistry.json) reads from process.cwd(), which is
  // the same directory as LOWDEFY_DIRECTORY_CONFIG in a real dev server run.
  previousCwd = process.cwd();
  process.chdir(configDirectory);
});

afterEach(() => {
  process.chdir(previousCwd);
  fs.rmSync(configDirectory, { recursive: true, force: true });
  if (previousConfigDirectory === undefined) {
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  } else {
    process.env.LOWDEFY_DIRECTORY_CONFIG = previousConfigDirectory;
  }
});

test('scaffoldPage writes a canonical page file and reports the next step', () => {
  const result = scaffoldPage({ pageId: 'reports', title: 'Reports' });

  expect(result).toEqual({
    created: path.join('pages', 'reports.yaml'),
    next: 'Add `- _ref: pages/reports.yaml` under `pages:` in lowdefy.yaml (or the relevant pages file), then check lowdefy_build_status.',
  });

  const written = fs.readFileSync(path.join(configDirectory, 'pages', 'reports.yaml'), 'utf8');
  expect(written).toContain('id: reports');
  expect(written).toContain('type: PageHeaderMenu');
  expect(written).toContain('title: "Reports"');
  expect(written).toContain('type: Title');
  expect(written).toContain('content: "Reports"');
});

test('scaffoldPage defaults the title to the pageId when no title is given', () => {
  scaffoldPage({ pageId: 'dashboard' });

  const written = fs.readFileSync(path.join(configDirectory, 'pages', 'dashboard.yaml'), 'utf8');
  expect(written).toContain('title: "dashboard"');
});

test('scaffoldPage refuses an invalid page id', () => {
  const result = scaffoldPage({ pageId: 'has a space' });

  expect(result.error).toContain('Invalid page id');
  expect(fs.existsSync(path.join(configDirectory, 'pages', 'has a space.yaml'))).toBe(false);
});

test('scaffoldPage refuses when the page file already exists', () => {
  fs.mkdirSync(path.join(configDirectory, 'pages'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'pages', 'reports.yaml'), 'id: reports\n');

  const result = scaffoldPage({ pageId: 'reports' });

  expect(result.error).toEqual(`"${path.join('pages', 'reports.yaml')}" already exists.`);
});

test('scaffoldPage refuses when the pageId is already used in the build registry', () => {
  fs.mkdirSync(path.join(configDirectory, 'build'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'build', 'pageRegistry.json'),
    JSON.stringify({ reports: {} })
  );

  const result = scaffoldPage({ pageId: 'reports' });

  expect(result.error).toContain('Page id "reports" is already used');
  expect(fs.existsSync(path.join(configDirectory, 'pages', 'reports.yaml'))).toBe(false);
});
