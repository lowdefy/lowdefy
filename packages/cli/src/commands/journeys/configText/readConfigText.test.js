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
import { jest } from '@jest/globals';

import readConfigText from './readConfigText.js';

// A stand-in for the installed dev server's builder: it logs each call and
// writes every `text:` line of the app's pages/*.yaml as config text, unless
// the config says BROKEN. With NO_TEXT it builds like a builder older than
// the config text set.
const FAKE_BUILDER = `
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { config: { type: 'string' }, out: { type: 'string' } } });
const devDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
fs.appendFileSync(path.join(devDirectory, 'calls.log'), JSON.stringify(values) + '\\n');
const config = fs.readFileSync(path.join(values.config, 'lowdefy.yaml'), 'utf8');
fs.mkdirSync(path.join(values.out, 'build'), { recursive: true });
console.log(JSON.stringify({ level: 30, msg: 'building' }));
if (config.includes('BROKEN')) {
  fs.writeFileSync(path.join(values.out, 'result.json'), JSON.stringify({
    status: 'error',
    errors: [{ message: 'Block type "Buton" was used but is not defined.', source: 'pages/home.yaml:4' }],
    warnings: [],
  }));
  process.exitCode = 1;
} else {
  if (!config.includes('NO_TEXT')) {
    const pagesDirectory = path.join(values.config, 'pages');
    const texts = fs.readdirSync(pagesDirectory).flatMap((name) =>
      fs.readFileSync(path.join(pagesDirectory, name), 'utf8')
        .split('\\n')
        .filter((line) => line.startsWith('text: '))
        .map((line) => line.slice(6))
    );
    fs.writeFileSync(path.join(values.out, 'configText.json'), JSON.stringify(texts.sort()));
  }
  fs.writeFileSync(path.join(values.out, 'result.json'), JSON.stringify({ status: 'ok', errors: [], warnings: [] }));
}
`;

let root;
let context;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-text-'));
  const config = path.join(root, 'app');
  const dev = path.join(config, '.lowdefy', 'dev');
  fs.mkdirSync(path.join(dev, 'lib', 'docs', 'explore'), { recursive: true });
  fs.writeFileSync(path.join(dev, 'lib', 'docs', 'explore', 'buildConfigTree.mjs'), FAKE_BUILDER);
  fs.writeFileSync(path.join(dev, 'package.json'), JSON.stringify({ version: '6.1.0' }));
  fs.mkdirSync(path.join(config, 'pages'));
  fs.mkdirSync(path.join(config, 'tests', 'journeys'), { recursive: true });
  fs.writeFileSync(path.join(config, 'lowdefy.yaml'), 'lowdefy: 6.1.0\n');
  fs.writeFileSync(path.join(config, 'pages', 'home.yaml'), 'text: Assign\ntext: Delete\n');
  fs.writeFileSync(path.join(config, 'tests', 'journeys', 'x.yaml'), 'name: x\n');
  context = {
    directories: { config, dev },
    options: {},
    logger: { debug: jest.fn(), info: jest.fn() },
  };
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function calls() {
  const log = path.join(context.directories.dev, 'calls.log');
  if (!fs.existsSync(log)) return [];
  return fs.readFileSync(log, 'utf8').trim().split('\n');
}

function cacheEntries() {
  const cacheDirectory = path.join(
    context.directories.config,
    '.lowdefy',
    'journeys',
    'config-text'
  );
  if (!fs.existsSync(cacheDirectory)) return [];
  return fs.readdirSync(cacheDirectory);
}

test('readConfigText returns the config text set the builder wrote', async () => {
  const { texts, isConfigText } = await readConfigText({ context });
  expect([...texts]).toEqual(['Assign', 'Delete']);
  expect(isConfigText('Assign')).toBe(true);
  expect(isConfigText('  Assign\n')).toBe(true);
  expect(isConfigText('Acme Ltd')).toBe(false);
  expect(isConfigText(null)).toBe(false);
  expect(isConfigText('')).toBe(false);
});

test('readConfigText reuses the cached set when the config has not changed', async () => {
  await readConfigText({ context });
  await readConfigText({ context });
  expect(calls()).toHaveLength(1);
  const [entry] = cacheEntries();
  expect(
    fs
      .readdirSync(
        path.join(context.directories.config, '.lowdefy', 'journeys', 'config-text', entry)
      )
      .sort()
  ).toEqual(['configText.json']);
});

test('readConfigText started twice together with an empty cache returns one set and leaves no scratch', async () => {
  const [first, second] = await Promise.all([
    readConfigText({ context }),
    readConfigText({ context }),
  ]);
  expect([...first.texts]).toEqual(['Assign', 'Delete']);
  expect([...second.texts]).toEqual(['Assign', 'Delete']);
  const entries = cacheEntries();
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatch(/^[0-9a-f]{16}$/);
  expect(
    fs.readdirSync(
      path.join(context.directories.config, '.lowdefy', 'journeys', 'config-text', entries[0])
    )
  ).toEqual(['configText.json']);
});

test('readConfigText never deletes a set another read wrote when its own build fails', async () => {
  await readConfigText({ context });
  const [written] = cacheEntries();
  fs.writeFileSync(path.join(context.directories.config, 'lowdefy.yaml'), 'BROKEN\n');
  await expect(readConfigText({ context })).rejects.toThrow('does not build');
  expect(cacheEntries()).toEqual([written]);
});

test('readConfigText removes a scratch directory a stopped build left, and not one still building', async () => {
  const cacheDirectory = path.join(
    context.directories.config,
    '.lowdefy',
    'journeys',
    'config-text'
  );
  const stopped = path.join(cacheDirectory, '0123456789abcdef.111-aaaaaaaa');
  const building = path.join(cacheDirectory, '0123456789abcdef.222-bbbbbbbb');
  fs.mkdirSync(stopped, { recursive: true });
  fs.mkdirSync(building, { recursive: true });
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  fs.utimesSync(stopped, twoHoursAgo, twoHoursAgo);
  await readConfigText({ context });
  const entries = cacheEntries();
  expect(entries).not.toContain('0123456789abcdef.111-aaaaaaaa');
  expect(entries).toContain('0123456789abcdef.222-bbbbbbbb');
  expect(entries).toHaveLength(2);
});

test('readConfigText rebuilds when the ref resolver changes', async () => {
  await readConfigText({ context });
  context.options.refResolver = 'resolvers/refs.js';
  await readConfigText({ context });
  expect(calls()).toHaveLength(2);
});

test('readConfigText rebuilds when a page changes and keeps only the newest set', async () => {
  await readConfigText({ context });
  fs.writeFileSync(path.join(context.directories.config, 'pages', 'home.yaml'), 'text: Archive\n');
  const { texts } = await readConfigText({ context });
  expect([...texts]).toEqual(['Archive']);
  expect(calls()).toHaveLength(2);
  expect(cacheEntries()).toHaveLength(1);
});

test('readConfigText does not rebuild when a journey or a pulled trace changes', async () => {
  await readConfigText({ context });
  fs.writeFileSync(
    path.join(context.directories.config, 'tests', 'journeys', 'x.yaml'),
    'name: y\n'
  );
  fs.mkdirSync(path.join(context.directories.config, '.lowdefy', 'traces', 'production'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(context.directories.config, '.lowdefy', 'traces', 'production', '2026-10-01.jsonl'),
    '{}\n'
  );
  await readConfigText({ context });
  expect(calls()).toHaveLength(1);
});

test('readConfigText rebuilds when the builder version changes', async () => {
  await readConfigText({ context });
  fs.writeFileSync(
    path.join(context.directories.dev, 'package.json'),
    JSON.stringify({ version: '6.2.0' })
  );
  await readConfigText({ context });
  expect(calls()).toHaveLength(2);
});

test('readConfigText stops on a config that does not build and caches nothing', async () => {
  fs.writeFileSync(path.join(context.directories.config, 'lowdefy.yaml'), 'BROKEN\n');
  await expect(readConfigText({ context })).rejects.toThrow(
    'The app config does not build, so its config text cannot be read:\n  pages/home.yaml:4: Block type "Buton" was used but is not defined.'
  );
  expect(cacheEntries()).toEqual([]);
  await expect(readConfigText({ context })).rejects.toThrow('does not build');
  expect(calls()).toHaveLength(2);
});

test('readConfigText asks for a dev server update when the builder writes no config text', async () => {
  fs.writeFileSync(path.join(context.directories.config, 'lowdefy.yaml'), 'NO_TEXT\n');
  await expect(readConfigText({ context })).rejects.toThrow(
    `The dev server installed in ${context.directories.dev} is older than this CLI and writes no config text. Stop the running dev server and start it again to update it.`
  );
  expect(cacheEntries()).toEqual([]);
});

test('readConfigText asks for lowdefy dev when no dev server is installed', async () => {
  fs.rmSync(context.directories.dev, { recursive: true });
  await expect(readConfigText({ context })).rejects.toThrow(
    `No dev server is installed in ${context.directories.dev}. Run lowdefy dev once, then try again.`
  );
});

test('readConfigText logs no value from the environment', async () => {
  process.env.LOWDEFY_CONFIG_TEXT_TEST_SECRET = 'secret-value-123';
  try {
    await readConfigText({ context });
  } finally {
    delete process.env.LOWDEFY_CONFIG_TEXT_TEST_SECRET;
  }
  const logged = JSON.stringify([context.logger.debug.mock.calls, context.logger.info.mock.calls]);
  expect(logged).not.toContain('secret-value-123');
});
