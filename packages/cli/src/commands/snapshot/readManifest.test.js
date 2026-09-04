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

import readManifest from './readManifest.js';

let configDirectory;

function writeManifest(content) {
  fs.mkdirSync(path.join(configDirectory, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'tests', 'snapshots.yaml'), content);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-snapshot-manifest-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('readManifest returns undefined when the app has no tests/snapshots.yaml', () => {
  expect(readManifest({ configDirectory })).toBeUndefined();
});

test('readManifest parses the manifest', () => {
  writeManifest(`pages:
  - pageId: controls
    users: [admin, member]
  - pageId: control
    users: [admin]
    urlQuery: { slug: iso-27001 }
    journey: tests/journeys/open-detail.yaml
`);
  expect(readManifest({ configDirectory })).toEqual({
    pages: [
      { pageId: 'controls', users: ['admin', 'member'] },
      {
        pageId: 'control',
        users: ['admin'],
        urlQuery: { slug: 'iso-27001' },
        journey: 'tests/journeys/open-detail.yaml',
      },
    ],
  });
});

test('readManifest throws on invalid YAML', () => {
  writeManifest('pages: [\n');
  expect(() => readManifest({ configDirectory })).toThrow(/Invalid YAML in tests\/snapshots.yaml/);
});

test('readManifest throws when pages is missing', () => {
  writeManifest('users: [admin]\n');
  expect(() => readManifest({ configDirectory })).toThrow(
    /Snapshot manifest should have required property "pages"/
  );
});

test('readManifest throws when a page has no pageId', () => {
  writeManifest('pages:\n  - users: [admin]\n');
  expect(() => readManifest({ configDirectory })).toThrow(
    /Snapshot page should have required property "pageId"/
  );
});

test('readManifest throws when users is not an array of strings', () => {
  writeManifest('pages:\n  - pageId: a\n    users: admin\n');
  expect(() => readManifest({ configDirectory })).toThrow(
    /Snapshot page "users" should be an array of dev user names/
  );
});

test('readManifest parses a page ignore list', () => {
  writeManifest('pages:\n  - pageId: a\n    ignore: [form.created_at, rows.$.score]\n');
  expect(readManifest({ configDirectory })).toEqual({
    pages: [{ pageId: 'a', ignore: ['form.created_at', 'rows.$.score'] }],
  });
});

test('readManifest throws when ignore is not an array of strings', () => {
  writeManifest('pages:\n  - pageId: a\n    ignore: form.created_at\n');
  expect(() => readManifest({ configDirectory })).toThrow(
    /Snapshot page "ignore" should be an array of state paths/
  );
});
