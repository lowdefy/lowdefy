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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PNG } from 'pngjs';

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { get: mockGet } }));

const mockStop = jest.fn();
const mockStartDevServer = jest.fn();
jest.unstable_mockModule('../test/startDevServer.js', () => ({ default: mockStartDevServer }));

const { default: snapshot } = await import('./snapshot.js');

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

let configDirectory;
let context;
let logs;
let pages;
let users;
let captures;

function capture(overrides = {}) {
  return {
    pageId: 'home',
    screenshot: makePng(),
    dom: '<div id="root"><p>Hello</p></div>',
    state: { title: 'Hello' },
    snapshotIgnore: [],
    ...overrides,
  };
}

function serveRoutes() {
  mockGet.mockImplementation((url, options = {}) => {
    const route = url.slice(url.indexOf('/lowdefy-docs/'));
    if (route === '/lowdefy-docs/app-map') {
      return Promise.resolve({ data: { pages: pages.map((pageId) => ({ pageId })) } });
    }
    if (route === '/lowdefy-docs/dev-users') {
      return Promise.resolve({ data: { users } });
    }
    const pageId = route.slice('/lowdefy-docs/snapshot/'.length);
    const key = `${pageId}/${options.params?.user ?? 'headless'}`;
    const handler = captures[key];
    if (!handler) {
      return Promise.reject(new Error(`unexpected snapshot ${key}`));
    }
    return Promise.resolve({ data: handler(options.params) });
  });
}

function writeManifest(content) {
  fs.mkdirSync(path.join(configDirectory, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'tests', 'snapshots.yaml'), content);
}

function goldenFiles(pageId, user) {
  const directory = path.join(configDirectory, 'snapshots', pageId, user);
  return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : undefined;
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-snapshot-command-'));
  logs = { info: [], warn: [], error: [] };
  context = {
    commandLineOptions: {},
    directories: {
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
    },
    options: { port: 3248 },
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
      debug: () => {},
    },
    sendTelemetry: jest.fn(),
  };
  mockStartDevServer.mockResolvedValue({
    url: 'http://localhost:3248',
    port: 3248,
    stop: mockStop,
  });
  pages = ['home', 'about'];
  users = ['admin', 'member'];
  captures = {
    'home/admin': () => capture(),
    'home/member': () => capture(),
    'about/admin': () => capture({ pageId: 'about' }),
    'about/member': () => capture({ pageId: 'about' }),
  };
  serveRoutes();
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  process.exitCode = undefined;
});

test('snapshot with neither --check nor --update exits 1 with a usage message and no server', async () => {
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error[0]).toMatch(/Exactly one of --check and --update is required/);
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

test('snapshot with both --check and --update exits 1 with the usage message', async () => {
  context.options.check = true;
  context.options.update = true;
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error[0]).toMatch(/Exactly one of --check and --update/);
});

test('snapshot --update without a manifest writes every page for every dev user and stops the server', async () => {
  context.options.update = true;
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
  expect(goldenFiles('home', 'admin')).toEqual(['dom.html', 'screenshot.png', 'state.json']);
  expect(goldenFiles('home', 'member')).toEqual(['dom.html', 'screenshot.png', 'state.json']);
  expect(goldenFiles('about', 'admin')).toEqual(['dom.html', 'screenshot.png', 'state.json']);
  expect(goldenFiles('about', 'member')).toEqual(['dom.html', 'screenshot.png', 'state.json']);
  expect(logs.info).toContain('4 snapshots written');
  expect(mockStop).toHaveBeenCalled();
  expect(mockStartDevServer).toHaveBeenCalledWith({ context, env: {} });
});

test('snapshot --update passes the snapshot route the user, urlQuery and journey from the manifest', async () => {
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'journeys', 'open.yaml'),
    'name: open\npageId: home\nsteps:\n  - click: open\n'
  );
  writeManifest(`pages:
  - pageId: home
    users: [admin]
    urlQuery: { slug: x }
    journey: tests/journeys/open.yaml
`);
  const params = [];
  captures['home/admin'] = (p) => {
    params.push(p);
    return capture();
  };
  context.options.update = true;
  await snapshot({ context });
  expect(params).toEqual([
    { user: 'admin', urlQuery: '{"slug":"x"}', journey: '[{"click":"open"}]' },
  ]);
  expect(goldenFiles('home', 'member')).toBeUndefined();
  // The manifest names users for every page, so the dev user list is not fetched.
  expect(mockGet.mock.calls.some(([url]) => url.endsWith('/lowdefy-docs/dev-users'))).toBe(false);
  expect(mockGet.mock.calls.some(([url]) => url.endsWith('/lowdefy-docs/app-map'))).toBe(false);
});

test('snapshot --update honours --pages and --users filters', async () => {
  context.options.update = true;
  context.options.pages = 'about';
  context.options.users = 'member';
  await snapshot({ context });
  expect(goldenFiles('about', 'member')).toBeDefined();
  expect(goldenFiles('about', 'admin')).toBeUndefined();
  expect(goldenFiles('home', 'member')).toBeUndefined();
  expect(logs.info).toContain('1 snapshots written');
});

test('snapshot --check exits 1 when no golden has been written', async () => {
  context.options.check = true;
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error.some((line) => /FAIL {2}home as admin .*dom.html/.test(line))).toBe(true);
  expect(logs.error.at(-1)).toBe(
    '0 passed, 4 changed, 0 failed of 4 snapshots, 4 with advisory pixel drift'
  );
});

test('snapshot --check passes on unchanged config after --update', async () => {
  context.options.update = true;
  await snapshot({ context });
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toHaveLength(4);
  expect(logs.info.at(-1)).toBe('4 passed, 0 changed, 0 failed of 4 snapshots');
});

test('snapshot --check fails naming the page, user and drifted artefacts after a change', async () => {
  context.options.update = true;
  await snapshot({ context });
  captures['home/member'] = () =>
    capture({
      screenshot: makePng({ dark: true }),
      dom: '<div id="root"><p>Goodbye</p></div>',
      state: { title: 'Hello' },
    });
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  const fails = logs.error.filter((line) => line.startsWith('FAIL'));
  expect(fails).toHaveLength(1);
  expect(fails[0]).toMatch(/home as member {2}snapshots\/home\/member\/dom.html/);
  expect(logs.error).toContain('      -2 <p>Hello</p>');
  expect(logs.error).toContain('      +2 <p>Goodbye</p>');
  // Pixel drift is reported, and its diff.png written, without failing the run.
  const advisories = logs.warn.filter((line) => line.startsWith('ADVISORY'));
  expect(advisories).toHaveLength(1);
  expect(advisories[0]).toMatch(/home as member {2}snapshots\/home\/member\/screenshot.png/);
  expect(
    fs.existsSync(
      path.join(configDirectory, '.lowdefy', 'snapshot-diff', 'home', 'member', 'diff.png')
    )
  ).toBe(true);
  expect(logs.error.at(-1)).toBe(
    '3 passed, 1 changed, 0 failed of 4 snapshots, 1 with advisory pixel drift'
  );
});

test('snapshot --check passes on pixel drift alone and reports it as advisory', async () => {
  captures = { 'home/admin': () => capture() };
  users = ['admin'];
  pages = ['home'];
  context.options.update = true;
  await snapshot({ context });
  captures['home/admin'] = () => capture({ screenshot: makePng({ dark: true }) });
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
  expect(logs.warn.filter((line) => line.startsWith('ADVISORY'))).toHaveLength(1);
  expect(logs.warn).toContain(
    '      pixel drift does not fail --check; use --fail-on-pixel to make it.'
  );
  expect(logs.info).toContain('PASS  home as admin');
  expect(logs.info.at(-1)).toBe(
    '1 passed, 0 changed, 0 failed of 1 snapshots, 1 with advisory pixel drift'
  );
});

test('snapshot --check --fail-on-pixel exits 1 on pixel drift alone', async () => {
  captures = { 'home/admin': () => capture() };
  users = ['admin'];
  pages = ['home'];
  context.options.update = true;
  await snapshot({ context });
  captures['home/admin'] = () => capture({ screenshot: makePng({ dark: true }) });
  context.options = { port: 3248, check: true, failOnPixel: true };
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  const fails = logs.error.filter((line) => line.startsWith('FAIL'));
  expect(fails).toHaveLength(1);
  expect(fails[0]).toMatch(/home as admin {2}snapshots\/home\/admin\/screenshot.png/);
  expect(logs.error.at(-1)).toBe('0 passed, 1 changed, 0 failed of 1 snapshots');
});

test('snapshot --check treats a manifest ignore path as no drift', async () => {
  writeManifest(`pages:
  - pageId: home
    users: [admin]
    ignore:
      - rows.$.score
`);
  captures = {
    'home/admin': () => capture({ state: { rows: [{ id: 1, score: 0.1 }] } }),
  };
  context.options.update = true;
  await snapshot({ context });
  // The golden never records an ignored path, so it does not churn on --update.
  expect(
    fs.readFileSync(path.join(configDirectory, 'snapshots', 'home', 'admin', 'state.json'), 'utf8')
  ).toBe('{\n  "rows": [\n    {\n      "id": 1\n    }\n  ]\n}\n');
  captures['home/admin'] = () => capture({ state: { rows: [{ id: 1, score: 0.9 }] } });
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
});

test('snapshot --check does not drift on a timestamp state value', async () => {
  captures = {
    'home/admin': () => capture({ state: { created_at: '2026-01-01T00:00:00.000Z' } }),
  };
  users = ['admin'];
  pages = ['home'];
  context.options.update = true;
  await snapshot({ context });
  captures['home/admin'] = () => capture({ state: { created_at: '2027-09-09T10:11:12.999Z' } });
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
});

test('snapshot --check treats an ignored state path as no drift', async () => {
  captures = {
    'home/admin': () => capture({ state: { title: 'Hello', now: 1 }, snapshotIgnore: ['now'] }),
  };
  users = ['admin'];
  pages = ['home'];
  context.options.update = true;
  await snapshot({ context });
  captures['home/admin'] = () =>
    capture({ state: { title: 'Hello', now: 2 }, snapshotIgnore: ['now'] });
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
});

test('snapshot reports a snapshot route error per target and exits 1', async () => {
  captures['home/admin'] = () => ({
    error: 'Journey step 0 failed before the snapshot was taken: x',
  });
  context.options.update = true;
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error).toContain(
    'FAIL  home as admin  Journey step 0 failed before the snapshot was taken: x'
  );
  expect(logs.error.at(-1)).toBe('3 snapshots written, 1 failed');
  expect(mockStop).toHaveBeenCalled();
});

test('snapshot exits 1 on an invalid manifest before starting the server', async () => {
  writeManifest('pages: nope\n');
  context.options.check = true;
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error[0]).toMatch(/Snapshot manifest "pages" should be an array/);
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

test('snapshot exits 1 on an invalid --pixel-tolerance', async () => {
  context.options.check = true;
  context.options.pixelTolerance = '5';
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error[0]).toMatch(/--pixel-tolerance should be a fraction between 0 and 1/);
});

test('snapshot --check honours --pixel-tolerance', async () => {
  users = ['admin'];
  pages = ['home'];
  captures = { 'home/admin': () => capture() };
  context.options.update = true;
  await snapshot({ context });
  captures['home/admin'] = () => capture({ screenshot: makePng({ dark: true }) });
  context.options = { port: 3248, check: true, pixelTolerance: '0.9' };
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
});

test('snapshot stops the server and rethrows when the dev server fails to boot', async () => {
  const error = new Error('boot failed');
  error.serverOutput = ['line one'];
  mockStartDevServer.mockRejectedValue(error);
  context.options.check = true;
  await expect(snapshot({ context })).rejects.toThrow('boot failed');
  expect(logs.error).toContain('line one');
});

test('snapshot --check fails one target on a corrupt golden and still checks the rest', async () => {
  context.options.update = true;
  await snapshot({ context });
  // A corrupt screenshot golden (an LFS pointer, a bad merge) throws inside
  // the compare — it must fail THIS target only, not abort the run and count
  // the unvisited targets as passed.
  fs.writeFileSync(
    path.join(configDirectory, 'snapshots', 'home', 'admin', 'screenshot.png'),
    'not a png'
  );
  context.options = { port: 3248, check: true };
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error.some((line) => /FAIL {2}home as admin/.test(line))).toBe(true);
  expect(logs.error.at(-1)).toBe('3 passed, 0 changed, 1 failed of 4 snapshots');
});

test('snapshot --check exits 1 when a --pages filter matches nothing', async () => {
  context.options.check = true;
  context.options.pages = 'controlz';
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error.at(-1)).toBe('No pages matched --pages "controlz".');
});

test('snapshot --check exits 0 with a warning when the app has no pages and no filter is set', async () => {
  pages = [];
  users = [];
  context.options.check = true;
  await snapshot({ context });
  expect(process.exitCode).toBeUndefined();
  expect(logs.warn).toContain('No snapshots to take: no pages matched.');
});

test('snapshot --check reports a broken manifest journey as the failure, not a snapshot count', async () => {
  writeManifest(`pages:
  - pageId: home
    users: [admin]
    journey: tests/journeys/missing.yaml
`);
  context.options.check = true;
  await snapshot({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error.at(-1)).toMatch(/Journey file .*missing.yaml.* not found/);
  expect(logs.error.some((line) => /passed,/.test(line))).toBe(false);
  expect(mockStop).toHaveBeenCalled();
});

test('snapshot --url captures from a running server without booting or stopping one', async () => {
  context.options.update = true;
  context.options.url = 'http://localhost:3000/';
  await snapshot({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockStop).not.toHaveBeenCalled();
  expect(mockGet.mock.calls[0][0]).toMatch(/^http:\/\/localhost:3000\/lowdefy-docs\//);
  expect(logs.info[0]).toEqual('Running against http://localhost:3000.');
  expect(process.exitCode).toBeUndefined();
});
