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
import { afterEach, beforeEach, expect, test } from 'vitest';

import hashConfigSources from './hashConfigSources.js';

let configDirectory;

function write(file, content) {
  const filePath = path.join(configDirectory, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-sources-'));
  write('lowdefy.yaml', 'lowdefy: local\n');
  write('pages/home.yaml', 'id: home\n');
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('moves when a config file is edited, added or removed', () => {
  const first = hashConfigSources({ configDirectory });
  expect(first).toMatch(/^[0-9a-f]{40}$/);
  expect(hashConfigSources({ configDirectory })).toBe(first);
  write('pages/home.yaml', 'id: home\ntype: Card\n');
  const edited = hashConfigSources({ configDirectory });
  expect(edited).not.toBe(first);
  write('tests/data/base.yaml', 'users: {}\n');
  const added = hashConfigSources({ configDirectory });
  expect(added).not.toBe(edited);
  fs.rmSync(path.join(configDirectory, 'tests', 'data', 'base.yaml'));
  expect(hashConfigSources({ configDirectory })).not.toBe(added);
});

test('ignores the build, installs, git and the journeys', () => {
  const first = hashConfigSources({ configDirectory });
  write('.lowdefy/test/headless-run.json', '{}');
  write('node_modules/x/index.js', '');
  write('.git/HEAD', 'ref');
  write('tests/journeys/a.yaml', 'name: a\n');
  expect(hashConfigSources({ configDirectory })).toBe(first);
});

test('is null for a directory it cannot read', () => {
  expect(hashConfigSources({ configDirectory: path.join(configDirectory, 'missing') })).toBeNull();
});
