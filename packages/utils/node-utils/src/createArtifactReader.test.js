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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import createArtifactReader from './createArtifactReader.js';

let buildDirectory;

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-reader-'));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

function write(name, value) {
  const filePath = path.join(buildDirectory, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, typeof value === 'string' ? value : JSON.stringify(value));
  return filePath;
}

// Sets a file's modified time well in the past, so its read lands outside the racy window.
function age(filePath) {
  const past = new Date(Date.now() - 60000);
  fs.utimesSync(filePath, past, past);
}

test('createArtifactReader reads and deserializes an artifact by its path in the build', () => {
  write('pages/home.json', { pageId: 'home', at: { '~d': 0 } });
  const readArtifact = createArtifactReader({ buildDirectory });
  const page = readArtifact('pages/home.json');
  expect(page.pageId).toEqual('home');
  expect(page.at).toBeInstanceOf(Date);
});

test('createArtifactReader with deserialize false returns the parsed JSON as written', () => {
  write('pages/home.json', { at: { '~d': 0 } });
  const readArtifact = createArtifactReader({ buildDirectory, deserialize: false });
  expect(readArtifact('pages/home.json')).toEqual({ at: { '~d': 0 } });
});

test('createArtifactReader returns null for a file the build does not have', () => {
  const readArtifact = createArtifactReader({ buildDirectory });
  expect(readArtifact('api/missing.json')).toBe(null);
  expect(readArtifact('pages/missing/requests/missing.json')).toBe(null);
});

test('createArtifactReader reads an unchanged file once and returns the same value', () => {
  age(write('api/one.json', { id: 'one' }));
  const readArtifact = createArtifactReader({ buildDirectory });
  const readFileSync = vi.spyOn(fs, 'readFileSync');
  const first = readArtifact('api/one.json');
  const second = readArtifact('api/one.json');
  expect(second).toBe(first);
  expect(readFileSync).toHaveBeenCalledTimes(1);
});

test('createArtifactReader keeps a missing file as null without reading it', () => {
  const readArtifact = createArtifactReader({ buildDirectory });
  const readFileSync = vi.spyOn(fs, 'readFileSync');
  readArtifact('api/missing.json');
  readArtifact('api/missing.json');
  expect(readFileSync).not.toHaveBeenCalled();
});

test('createArtifactReader reads a file the build wrote after a read found none', () => {
  const readArtifact = createArtifactReader({ buildDirectory });
  expect(readArtifact('pages/late.json')).toBe(null);
  write('pages/late.json', { pageId: 'late' });
  expect(readArtifact('pages/late.json')).toEqual({ pageId: 'late' });
});

test('createArtifactReader returns null once the build removes a file it read', () => {
  write('pages/gone.json', { pageId: 'gone' });
  const readArtifact = createArtifactReader({ buildDirectory });
  readArtifact('pages/gone.json');
  fs.rmSync(path.join(buildDirectory, 'pages/gone.json'));
  expect(readArtifact('pages/gone.json')).toBe(null);
});

test('createArtifactReader reads a rewritten file again', () => {
  const filePath = write('pages/home.json', { title: 'one' });
  age(filePath);
  const readArtifact = createArtifactReader({ buildDirectory });
  expect(readArtifact('pages/home.json').title).toEqual('one');
  write('pages/home.json', { title: 'second' });
  expect(readArtifact('pages/home.json').title).toEqual('second');
});

test('createArtifactReader reads a file renamed into place again', () => {
  write('pages/home.json', { title: 'one' });
  const readArtifact = createArtifactReader({ buildDirectory });
  readArtifact('pages/home.json');
  write('pages/next.json', { title: 'two' });
  fs.renameSync(
    path.join(buildDirectory, 'pages/next.json'),
    path.join(buildDirectory, 'pages/home.json')
  );
  expect(readArtifact('pages/home.json').title).toEqual('two');
});

test('createArtifactReader sees a rewrite with the same size inside one millisecond', () => {
  write('pages/home.json', { title: 'one' });
  const readArtifact = createArtifactReader({ buildDirectory });
  expect(readArtifact('pages/home.json').title).toEqual('one');
  write('pages/home.json', { title: 'two' });
  expect(readArtifact('pages/home.json').title).toEqual('two');
});

test('createArtifactReader sees a same-size rewrite a coarse filesystem gives the same stat', () => {
  const filePath = write('pages/home.json', { title: 'one' });
  const readArtifact = createArtifactReader({ buildDirectory });
  const stat = fs.statSync(filePath, { bigint: true });
  expect(readArtifact('pages/home.json').title).toEqual('one');
  write('pages/home.json', { title: 'two' });
  // Inode, size and both times as the first read saw them, as within one timestamp tick.
  vi.spyOn(fs, 'statSync').mockReturnValue(stat);
  expect(readArtifact('pages/home.json').title).toEqual('two');
});

test('createArtifactReader trusts an unchanged stat once a read lands outside the racy window', () => {
  const filePath = write('pages/home.json', { title: 'one' });
  age(filePath);
  const readArtifact = createArtifactReader({ buildDirectory });
  const stat = fs.statSync(filePath, { bigint: true });
  expect(readArtifact('pages/home.json').title).toEqual('one');
  const readFileSync = vi.spyOn(fs, 'readFileSync');
  vi.spyOn(fs, 'statSync').mockReturnValue(stat);
  expect(readArtifact('pages/home.json').title).toEqual('one');
  expect(readFileSync).not.toHaveBeenCalled();
});

test('createArtifactReader does not parse a racy file again when its text is unchanged', () => {
  write('pages/home.json', { title: 'one' });
  const readArtifact = createArtifactReader({ buildDirectory, deserialize: false });
  const parse = vi.spyOn(JSON, 'parse');
  const first = readArtifact('pages/home.json');
  expect(readArtifact('pages/home.json')).toBe(first);
  expect(parse).toHaveBeenCalledTimes(1);
});

test('createArtifactReader throws on a file it cannot parse and reads it again once it is whole', () => {
  write('buildStatus.json', '{"state": "buil');
  const readArtifact = createArtifactReader({ buildDirectory });
  expect(() => readArtifact('buildStatus.json')).toThrow();
  write('buildStatus.json', { state: 'built' });
  expect(readArtifact('buildStatus.json')).toEqual({ state: 'built' });
});

test('createArtifactReader freezes the values it returns', () => {
  write('api/one.json', { id: 'one', routine: [{ id: 'step', properties: { a: 1 } }] });
  const readArtifact = createArtifactReader({ buildDirectory });
  const endpoint = readArtifact('api/one.json');
  expect(() => {
    endpoint.id = 'two';
  }).toThrow(TypeError);
  expect(() => {
    endpoint.routine.push({});
  }).toThrow(TypeError);
  expect(() => {
    endpoint.routine[0].properties.a = 2;
  }).toThrow(TypeError);
});

test('createArtifactReader keeps readers of different build directories apart', () => {
  write('api/one.json', { id: 'one' });
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-reader-'));
  fs.mkdirSync(path.join(other, 'api'));
  fs.writeFileSync(path.join(other, 'api/one.json'), JSON.stringify({ id: 'other' }));
  try {
    expect(createArtifactReader({ buildDirectory })('api/one.json').id).toEqual('one');
    expect(createArtifactReader({ buildDirectory: other })('api/one.json').id).toEqual('other');
  } finally {
    fs.rmSync(other, { recursive: true, force: true });
  }
});
