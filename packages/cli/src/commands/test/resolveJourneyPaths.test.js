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

test('resolveJourneyPaths expands a ** glob, a folder and a *.yaml glob to the same journeys', () => {
  const a = write('tests/journeys/review/a.yaml');
  const b = write('tests/journeys/review/b.yml');
  write('tests/journeys/review/README.md');
  write('tests/journeys/other.yaml');
  const expected = { files: [a, b] };
  const resolve = (given) =>
    resolveJourneyPaths({ paths: [given], base: configDirectory, configDirectory });
  expect(resolve('tests/journeys/review/**')).toEqual(expected);
  expect(resolve('tests/journeys/review')).toEqual(expected);
  expect(resolve('tests/journeys/review/*.y*ml')).toEqual(expected);
  expect(resolve('tests/journeys/review/[ab].*')).toEqual(expected);
});

test('resolveJourneyPaths matches a ** glob through sub-folders, _candidates included', () => {
  const nested = write('tests/journeys/review/deep/review-nested.yaml');
  const candidate = write('tests/journeys/_candidates/review-candidate.yaml');
  write('tests/journeys/other.yaml');
  expect(
    resolveJourneyPaths({
      paths: ['tests/journeys/**/review-*.yaml'],
      base: configDirectory,
      configDirectory,
    })
  ).toEqual({ files: [candidate, nested] });
});

test('resolveJourneyPaths resolves a glob against base and drops files a path already named', () => {
  const a = write('tests/journeys/a.yaml');
  const b = write('tests/journeys/b.yaml');
  expect(
    resolveJourneyPaths({
      paths: ['a.yaml', '*.yaml'],
      base: path.join(configDirectory, 'tests', 'journeys'),
      configDirectory,
    })
  ).toEqual({ files: [a, b] });
});

test('resolveJourneyPaths refuses a glob that matches nothing, or only files that are not journeys', () => {
  write('tests/journeys/notes.md');
  expect(
    resolveJourneyPaths({
      paths: ['tests/journeys/*.yaml'],
      base: configDirectory,
      configDirectory,
    })
  ).toEqual({ error: 'Journey path "tests/journeys/*.yaml" matches no files.' });
  expect(
    resolveJourneyPaths({ paths: ['tests/journeys/*'], base: configDirectory, configDirectory })
  ).toEqual({ error: 'Journey path "tests/journeys/*" matches no journey files.' });
});

test('resolveJourneyPaths refuses a glob that matches a file outside the config directory', () => {
  const appDirectory = path.join(configDirectory, 'app');
  write('app/tests/journeys/a.yaml');
  const outside = write('outside.yaml');
  expect(
    resolveJourneyPaths({ paths: ['../*.yaml'], base: appDirectory, configDirectory: appDirectory })
  ).toEqual({
    error: `Journey path "../*.yaml" matches ${outside}, outside the config directory ${appDirectory}.`,
  });
});

test('resolveJourneyPaths takes an existing path with glob characters in its name as it is', () => {
  const literal = write('tests/journeys/[draft].yaml');
  expect(
    resolveJourneyPaths({
      paths: ['tests/journeys/[draft].yaml'],
      base: configDirectory,
      configDirectory,
    })
  ).toEqual({ files: [literal] });
});
