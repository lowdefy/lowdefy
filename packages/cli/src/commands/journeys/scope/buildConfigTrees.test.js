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

import buildConfigTrees from './buildConfigTrees.js';

// A stand-in for the installed dev server's builder: it logs each call, and
// copies lowdefy.yaml into build/ unless the config says BROKEN.
const FAKE_BUILDER = `
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: { config: { type: 'string' }, out: { type: 'string' } } });
const devDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
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
  fs.writeFileSync(path.join(values.out, 'build', 'lowdefy.yaml'), config);
  fs.writeFileSync(path.join(values.out, 'result.json'), JSON.stringify({ status: 'ok', errors: [], warnings: [] }));
}
`;

let root;
let context;
let baseConfigDirectory;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-builds-'));
  const config = path.join(root, 'app');
  const dev = path.join(config, '.lowdefy', 'dev');
  fs.mkdirSync(path.join(dev, 'lib', 'configTree'), { recursive: true });
  fs.writeFileSync(path.join(dev, 'lib', 'configTree', 'buildConfigTree.mjs'), FAKE_BUILDER);
  fs.writeFileSync(path.join(dev, 'package.json'), JSON.stringify({ version: '6.1.0' }));
  fs.writeFileSync(path.join(config, 'lowdefy.yaml'), 'lowdefy: 6.1.0\n# head\n');
  baseConfigDirectory = path.join(config, '.lowdefy', 'scope', 'trees', 'base-sha', 'app');
  fs.mkdirSync(baseConfigDirectory, { recursive: true });
  fs.writeFileSync(path.join(baseConfigDirectory, 'lowdefy.yaml'), 'lowdefy: 6.1.0\n# base\n');
  context = {
    directories: { config, dev },
    options: {},
    logger: { debug: jest.fn() },
  };
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function calls() {
  const log = path.join(context.directories.dev, 'calls.log');
  if (!fs.existsSync(log)) return [];
  return fs
    .readFileSync(log, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

const cleanRevisions = { base: 'base-sha', head: 'head-sha', dirty: false };

function build(
  revisions = cleanRevisions,
  pluginSets = { missingFromHead: [], versionChanged: [] }
) {
  return buildConfigTrees({
    context,
    revisions,
    baseConfigDirectory,
    runDirectory: path.join(context.directories.config, '.lowdefy', 'scope', 'run-1'),
    pluginSets,
  });
}

test('buildConfigTrees builds base and head with the installed builder into the build cache', async () => {
  const result = await build();
  const buildsDirectory = path.join(context.directories.config, '.lowdefy', 'scope', 'builds');
  expect(result.baseBuild).toEqual(path.join(buildsDirectory, 'base-sha-6.1.0', 'build'));
  expect(result.headBuild).toEqual(path.join(buildsDirectory, 'head-sha-6.1.0', 'build'));
  expect(result.cached).toEqual({ base: false, head: false });
  expect(result.baseError).toBeUndefined();
  expect(fs.readFileSync(path.join(result.baseBuild, 'lowdefy.yaml'), 'utf8')).toContain('# base');
  expect(fs.readFileSync(path.join(result.headBuild, 'lowdefy.yaml'), 'utf8')).toContain('# head');
  expect(
    calls()
      .map((call) => call.config)
      .sort()
  ).toEqual([baseConfigDirectory, context.directories.config].sort());
  expect(context.logger.debug).toHaveBeenCalledWith(JSON.stringify({ level: 30, msg: 'building' }));
});

test('buildConfigTrees reuses the cached builds of a clean head', async () => {
  await build();
  const second = await build();
  expect(second.cached).toEqual({ base: true, head: true });
  expect(second.buildMs).toEqual({ base: 0, head: 0 });
  expect(calls()).toHaveLength(2);
});

test('buildConfigTrees builds a dirty head into the run directory every time', async () => {
  const dirty = { ...cleanRevisions, dirty: true };
  await build(dirty);
  const second = await build(dirty);
  expect(second.cached).toEqual({ base: true, head: false });
  expect(second.headBuild).toEqual(
    path.join(context.directories.config, '.lowdefy', 'scope', 'run-1', 'head-build', 'build')
  );
  expect(calls().filter((call) => call.config === context.directories.config)).toHaveLength(2);
});

test('buildConfigTrees stops on a head that does not build, with its errors', async () => {
  fs.writeFileSync(path.join(context.directories.config, 'lowdefy.yaml'), 'BROKEN\n');
  await expect(build()).rejects.toThrow(
    'The config at the head does not build, so there is nothing to compare:\n  pages/home.yaml:4: Block type "Buton" was used but is not defined.'
  );
});

test('buildConfigTrees returns a base build error and does not cache it', async () => {
  fs.writeFileSync(path.join(baseConfigDirectory, 'lowdefy.yaml'), 'BROKEN\n');
  const result = await build();
  expect(result.baseBuild).toBeNull();
  expect(result.baseError).toEqual(
    'The config at the base does not build, so every page is a target:\n  pages/home.yaml:4: Block type "Buton" was used but is not defined.'
  );
  await build();
  expect(calls().filter((call) => call.config === baseConfigDirectory)).toHaveLength(2);
});

test('buildConfigTrees names the plugins the head does not install when the base fails', async () => {
  fs.writeFileSync(path.join(baseConfigDirectory, 'lowdefy.yaml'), 'BROKEN\n');
  const result = await build(cleanRevisions, {
    missingFromHead: ['@acme/legacy'],
    versionChanged: [],
  });
  expect(result.baseError).toEqual(
    'The base lists plugins the head does not install (@acme/legacy), so the base could not be built. Every page is a target.'
  );
});

test('buildConfigTrees builds only the head for a head-only run', async () => {
  const result = await build({ base: null, head: 'head-sha', dirty: false });
  const buildsDirectory = path.join(context.directories.config, '.lowdefy', 'scope', 'builds');
  expect(result).toEqual({
    baseBuild: null,
    headBuild: path.join(buildsDirectory, 'head-sha-6.1.0', 'build'),
    buildMs: { base: null, head: expect.any(Number) },
    cached: { base: false, head: false },
  });
  expect(calls().map((call) => call.config)).toEqual([context.directories.config]);
});

test('buildConfigTrees asks for a dev server update when the builder is missing', async () => {
  fs.rmSync(path.join(context.directories.dev, 'lib'), { recursive: true });
  await expect(build()).rejects.toThrow(
    `The dev server installed in ${context.directories.dev} has no config tree builder. Stop the running dev server and start it again to update it.`
  );
});
