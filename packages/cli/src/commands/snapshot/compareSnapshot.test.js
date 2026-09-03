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
import { PNG } from 'pngjs';

import compareSnapshot from './compareSnapshot.js';
import writeSnapshot from './writeSnapshot.js';

function makePng({ dark = false } = {}) {
  const png = new PNG({ width: 20, height: 20 });
  for (let index = 0; index < 20 * 20 * 4; index += 4) {
    const value = dark && index < 20 * 20 * 2 ? 0 : 255;
    png.data[index] = value;
    png.data[index + 1] = value;
    png.data[index + 2] = value;
    png.data[index + 3] = 255;
  }
  return PNG.sync.write(png).toString('base64');
}

const target = { pageId: 'home', user: 'admin' };
let configDirectory;

function snapshot(overrides = {}) {
  return {
    screenshot: makePng(),
    dom: '<div id="root"><p class="css-dev-only-do-not-override-aaa11">Hello</p></div>',
    state: { title: 'Hello', created_at: '2026-01-01T00:00:00.000Z' },
    snapshotIgnore: ['created_at'],
    ...overrides,
  };
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-snapshot-compare-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('writeSnapshot writes the three artefacts formatted for diffs', () => {
  const paths = writeSnapshot({ configDirectory, target, snapshot: snapshot() });
  expect(fs.readdirSync(paths.goldenDirectory).sort()).toEqual([
    'dom.html',
    'screenshot.png',
    'state.json',
  ]);
  expect(fs.readFileSync(paths.dom, 'utf8')).toBe(
    '<div id="root">\n<p class="css-[HASH]">Hello</p>\n</div>\n'
  );
  expect(fs.readFileSync(paths.state, 'utf8')).toBe(
    '{\n  "created_at": "[TS]",\n  "title": "Hello"\n}\n'
  );
  expect(paths.label).toBe(path.join('snapshots', 'home', 'admin'));
});

test('writeSnapshot writes byte-identical dom and state for the same capture in another key order', () => {
  const first = writeSnapshot({ configDirectory, target, snapshot: snapshot() });
  const domA = fs.readFileSync(first.dom);
  const stateA = fs.readFileSync(first.state);
  writeSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({ state: { created_at: '2026-01-01T00:00:00.000Z', title: 'Hello' } }),
  });
  expect(fs.readFileSync(first.dom).equals(domA)).toBe(true);
  expect(fs.readFileSync(first.state).equals(stateA)).toBe(true);
});

test('writeSnapshot writes byte-identical files for two runs of a capture with moving values', () => {
  const first = writeSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({
      dom: '<div id="root"><p id="rc_select_1">2026-01-01T00:00:00.000Z</p></div>',
      state: {
        created_at: '2026-01-01T00:00:00.000Z',
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        rows: [{ id: 1, score: 0.1 }],
      },
    }),
    ignore: ['rows.$.score'],
  });
  const dom = fs.readFileSync(first.dom);
  const state = fs.readFileSync(first.state);
  writeSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({
      dom: '<div id="root"><p id="rc_select_7">2027-08-09T10:11:12.999Z</p></div>',
      state: {
        created_at: '2027-08-09T10:11:12.999Z',
        id: '00000000-1111-2222-3333-444444444444',
        rows: [{ id: 1, score: 0.9 }],
      },
    }),
    ignore: ['rows.$.score'],
  });
  expect(fs.readFileSync(first.dom).equals(dom)).toBe(true);
  expect(fs.readFileSync(first.state).equals(state)).toBe(true);
});

test('compareSnapshot round-trips an array wildcard ignore path without drift', () => {
  const ignore = ['rows.$.score'];
  const captured = snapshot({ state: { rows: [{ id: 1, score: 0.1 }] }, snapshotIgnore: ignore });
  const paths = writeSnapshot({ configDirectory, target, snapshot: captured, ignore });
  expect(JSON.parse(fs.readFileSync(paths.state, 'utf8'))).toEqual({ rows: [{ id: 1 }] });
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({ state: { rows: [{ id: 1, score: 0.9 }] }, snapshotIgnore: ignore }),
    pixelTolerance: 0.001,
    ignore,
  });
  expect(results.map((result) => result.changed)).toEqual([false, false, false]);
});

test('compareSnapshot round-trips an ignored whole array element without drift', () => {
  const ignore = ['rows.$'];
  const paths = writeSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({ state: { rows: [{ id: 1 }, { id: 2 }] } }),
    ignore,
  });
  expect(JSON.parse(fs.readFileSync(paths.state, 'utf8'))).toEqual({ rows: [null, null] });
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({ state: { rows: [{ id: 9 }, { id: 8 }] } }),
    pixelTolerance: 0.001,
    ignore,
  });
  expect(results.map((result) => result.changed)).toEqual([false, false, false]);
});

test('compareSnapshot reports every artefact missing when there is no golden', () => {
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot(),
    pixelTolerance: 0.001,
  });
  expect(results.map((r) => r.artefact)).toEqual(['screenshot.png', 'dom.html', 'state.json']);
  expect(results.every((r) => r.changed)).toBe(true);
  expect(results.map((r) => r.advisory)).toEqual([true, false, false]);
  expect(results[0].lines[0]).toMatch(/no committed screenshot.png/);
});

test('compareSnapshot passes when the capture matches the golden up to hashes and ignored paths', () => {
  writeSnapshot({ configDirectory, target, snapshot: snapshot() });
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({
      dom: '<div id="root"><p class="css-dev-only-do-not-override-zzz99">Hello</p></div>',
      state: { title: 'Hello', created_at: '2027-05-05T00:00:00.000Z' },
    }),
    pixelTolerance: 0.001,
  });
  expect(results.map((r) => r.changed)).toEqual([false, false, false]);
});

test('compareSnapshot reports drift per artefact and writes the pixel diff', () => {
  writeSnapshot({ configDirectory, target, snapshot: snapshot() });
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({
      screenshot: makePng({ dark: true }),
      dom: '<div id="root"><p class="css-dev-only-do-not-override-aaa11">Goodbye</p></div>',
      state: { title: 'Goodbye', created_at: '2026-01-01T00:00:00.000Z' },
    }),
    pixelTolerance: 0.001,
  });
  expect(results.map((r) => r.changed)).toEqual([true, true, true]);
  // Pixel drift is advisory unless the caller pins its renderer.
  expect(results.map((r) => r.advisory)).toEqual([true, false, false]);
  const diffPath = path.join(
    configDirectory,
    '.lowdefy',
    'snapshot-diff',
    'home',
    'admin',
    'diff.png'
  );
  expect(fs.existsSync(diffPath)).toBe(true);
  expect(results[0].lines[1]).toBe(`pixel diff written to ${diffPath}`);
  expect(results[1].lines).toEqual([
    '-2 <p class="css-[HASH]">Hello</p>',
    '+2 <p class="css-[HASH]">Goodbye</p>',
  ]);
  expect(results[2].lines).toEqual(['title: "Hello" -> "Goodbye"']);
});

test('compareSnapshot marks pixel drift not advisory when failOnPixel is set', () => {
  writeSnapshot({ configDirectory, target, snapshot: snapshot() });
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({ screenshot: makePng({ dark: true }) }),
    pixelTolerance: 0.001,
    failOnPixel: true,
  });
  expect(results[0].changed).toBe(true);
  expect(results.map((r) => r.advisory)).toEqual([false, false, false]);
});

test('compareSnapshot normalises a timestamp and a uuid in state before comparing', () => {
  writeSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({
      state: { created_at: '2026-01-01T00:00:00.000Z', id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
    }),
  });
  const { results } = compareSnapshot({
    configDirectory,
    target,
    snapshot: snapshot({
      state: { created_at: '2027-08-09T10:11:12.999Z', id: '00000000-1111-2222-3333-444444444444' },
    }),
    pixelTolerance: 0.001,
  });
  expect(results[2].changed).toBe(false);
});
