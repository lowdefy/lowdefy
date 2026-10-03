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

import resolveJourneyPaths from './resolveJourneyPaths.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-paths-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function write(relativePath) {
  const filePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'name: x\n');
  return filePath;
}

test('resolveJourneyPaths takes a directory recursively and a file as it is, relative to base', () => {
  const b = write('tests/journeys/_candidates/b.yaml');
  const a = write('tests/journeys/_candidates/mined/a.yml');
  write('tests/journeys/_candidates/notes.md');
  const single = write('tests/other/single.yaml');
  expect(
    resolveJourneyPaths({
      paths: ['tests/journeys/_candidates', 'tests/other/single.yaml'],
      base: configDirectory,
      configDirectory,
    })
  ).toEqual({ files: [b, a, single] });
});

test('resolveJourneyPaths refuses a path outside the config directory', () => {
  expect(
    resolveJourneyPaths({ paths: ['../elsewhere.yaml'], base: configDirectory, configDirectory })
  ).toEqual({
    error: `Journey path "../elsewhere.yaml" is outside the config directory ${configDirectory}.`,
  });
});

test('resolveJourneyPaths refuses a path that does not exist', () => {
  expect(
    resolveJourneyPaths({ paths: ['tests/missing.yaml'], base: configDirectory, configDirectory })
  ).toEqual({ error: 'Journey path "tests/missing.yaml" does not exist.' });
});
