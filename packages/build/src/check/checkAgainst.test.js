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
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import checkAgainst from './checkAgainst.js';

const logger = { debug: () => {}, error: () => {}, info: () => {}, warn: () => {} };

let root;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'lowdefy-check-against-test-'));
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

function pageYaml(id) {
  return `id: ${id}\ntype: Box\n`;
}

async function writeApp({ name, pages, migrations = [] }) {
  const directory = path.join(root, name);
  await fs.mkdir(path.join(directory, 'pages'), { recursive: true });
  const refs = pages.map((id) => `  - _ref: pages/${id}.yaml`).join('\n');
  await fs.writeFile(
    path.join(directory, 'lowdefy.yaml'),
    `lowdefy: 5.0.0\nname: test-app\npages:\n${refs}\n`
  );
  for (const id of pages) {
    await fs.writeFile(path.join(directory, 'pages', `${id}.yaml`), pageYaml(id));
  }
  if (migrations.length > 0) {
    await fs.mkdir(path.join(directory, 'migrations'), { recursive: true });
    for (const id of migrations) {
      await fs.writeFile(
        path.join(directory, 'migrations', `${id}.yaml`),
        `name: ${id}\nroutine:\n  - id: noop\n    type: MongoDBUpdateMany\n`
      );
    }
  }
  return directory;
}

function run({ againstDirectory, baseDirectory, configDirectory, ref = 'origin/develop' }) {
  return checkAgainst({
    againstDirectory,
    baseDirectory,
    buildOptions: {
      directories: {
        build: path.join(configDirectory, 'build'),
        config: configDirectory,
        server: configDirectory,
      },
      logger,
    },
    ref,
  });
}

test('checkAgainst reports a page id added on both branches and a migration that sorts before theirs', async () => {
  const configDirectory = await writeApp({
    name: 'current',
    pages: ['home', 'orders'],
    migrations: ['001-a'],
  });
  const againstDirectory = await writeApp({
    name: 'against',
    pages: ['home', 'orders'],
    migrations: ['002-b'],
  });
  const baseDirectory = await writeApp({ name: 'base', pages: ['home'] });

  const report = await run({ againstDirectory, baseDirectory, configDirectory });

  expect(report.warnings).toEqual([]);
  expect(report.errors.map((error) => error.message)).toEqual([
    'Page id "orders" is added on this branch and on "origin/develop". Merging them would declare it twice.',
    'Migration "001-a" sorts before migration "002-b", added on "origin/develop". Lexical order is execution order, so after merging "001-a" would be inserted before a migration that has already run.',
  ]);
  expect(report.errors[0].source).toEqual(path.join(configDirectory, 'pages', 'orders.yaml'));
  expect(report.errors[0].checkSlug).toEqual('branch-merge');
  expect(report.errors[1].source).toEqual(path.join(configDirectory, 'migrations', '001-a.yaml'));
  expect(report.ref).toEqual('origin/develop');
});

test('checkAgainst does not report an id that both branches already have at the merge base', async () => {
  const configDirectory = await writeApp({ name: 'current', pages: ['home', 'orders'] });
  const againstDirectory = await writeApp({ name: 'against', pages: ['home', 'orders'] });
  const baseDirectory = await writeApp({ name: 'base', pages: ['home', 'orders'] });

  const report = await run({ againstDirectory, baseDirectory, configDirectory });

  expect(report.errors).toEqual([]);
});

test('checkAgainst does not report a migration that sorts after every migration the target branch adds', async () => {
  const configDirectory = await writeApp({
    name: 'current',
    pages: ['home'],
    migrations: ['003-c'],
  });
  const againstDirectory = await writeApp({
    name: 'against',
    pages: ['home'],
    migrations: ['002-b'],
  });
  const baseDirectory = await writeApp({ name: 'base', pages: ['home'] });

  const report = await run({ againstDirectory, baseDirectory, configDirectory });

  expect(report.errors).toEqual([]);
});

test('checkAgainst warns instead of throwing when the target ref config cannot be read', async () => {
  const configDirectory = await writeApp({ name: 'current', pages: ['home'] });
  const baseDirectory = await writeApp({ name: 'base', pages: ['home'] });

  const report = await run({
    againstDirectory: path.join(root, 'missing'),
    baseDirectory,
    configDirectory,
  });

  expect(report.errors).toEqual([]);
  expect(report.warnings).toHaveLength(1);
  expect(report.warnings[0].message).toContain('Could not read the app config at the target ref');
  expect(report.warnings[0].checkSlug).toEqual('branch-merge');
});
