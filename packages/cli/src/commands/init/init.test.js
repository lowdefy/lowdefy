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
import { fileURLToPath } from 'url';
import YAML from 'yaml';

import init from './init.js';
import renderTemplate from './renderTemplate.js';
import templateFiles, { configTemplateFiles } from './templateFiles.js';

const commandDirectory = path.dirname(fileURLToPath(import.meta.url));
const templatesDirectory = path.join(commandDirectory, 'templates');
// The starter app is compiled by @lowdefy/build's snapshot suite as fixture
// 105-init-app; the CLI cannot build it from here, so the two are kept in step
// by comparing them.
const buildFixtureDirectory = path.resolve(
  commandDirectory,
  '../../../../build/src/tests/success/105-init-app'
);

let configDirectory;
let context;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-init-test-'));
  fs.mkdirSync(path.join(configDirectory, '.git'));
  context = {
    cliVersion: '9.9.9',
    directories: { config: configDirectory },
    options: { port: 3000 },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    sendTelemetry: jest.fn(),
  };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function read(relativePath) {
  return fs.readFileSync(path.join(configDirectory, relativePath), 'utf8');
}

test('init writes every file of the starter app', async () => {
  await init({ context });

  templateFiles.forEach(({ target }) => {
    expect(fs.existsSync(path.join(configDirectory, target))).toBe(true);
  });
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('init writes a lowdefy.yaml carrying the cli version, the directory name and the starter app', async () => {
  await init({ context });

  const appName = path.basename(configDirectory).toLowerCase();
  const app = YAML.parse(read('lowdefy.yaml'));
  expect(app.lowdefy).toEqual('9.9.9');
  expect(app.name).toEqual(appName);
  expect(app.config.experimental.archetypes).toBe(true);
  expect(app.collections.items.fields).toEqual({
    title: 'string',
    status: { enum: ['open', 'done'] },
    created_at: 'date',
  });
  expect(app.connections[0].id).toEqual('items');
  expect(app.connections[0].type).toEqual('MongoDBCollection');
  expect(app.connections[0].properties.databaseUri).toEqual({ _secret: 'MONGODB_URI' });
  expect(app.auth.dev.users.admin.roles).toEqual(['admin']);
  expect(app.pages).toEqual([{ _ref: 'pages/items.yaml' }, { _ref: 'pages/welcome.yaml' }]);
  expect(app.api).toEqual([{ _ref: 'api/add-item.yaml' }]);
  expect(app.menus[0].links.map((link) => link.pageId)).toEqual(['items', 'welcome']);
});

test('init points .env at a local MongoDB named after the app and writes a generated auth secret', async () => {
  await init({ context });

  const appName = path.basename(configDirectory).toLowerCase();
  const env = read('.env');
  expect(env).toContain(`MONGODB_URI=mongodb://localhost:27017/${appName}`);
  expect(env).toMatch(/BETTER_AUTH_SECRET=[0-9a-f]{64}/);
  expect(read('.env.example')).toContain('MONGODB_URI=\n');
});

test('init writes a .gitignore that keeps the migration ledgers and ignores .env', async () => {
  await init({ context });

  expect(read('.gitignore')).toEqual(
    `.lowdefy/*\n!.lowdefy/migrations/\n.lowdefy/migrations/local.json\n.env\n`
  );
});

test('init runs agent-setup on the new project', async () => {
  await init({ context });

  expect(fs.existsSync(path.join(configDirectory, '.mcp.json'))).toBe(true);
  expect(fs.existsSync(path.join(configDirectory, 'AGENTS.md'))).toBe(true);
  expect(
    fs.existsSync(path.join(configDirectory, '.claude', 'skills', 'lowdefy-config', 'SKILL.md'))
  ).toBe(true);
});

test('init does not run agent-setup when --no-agent-setup is given', async () => {
  context.options.agentSetup = false;
  await init({ context });

  expect(fs.existsSync(path.join(configDirectory, 'lowdefy.yaml'))).toBe(true);
  expect(fs.existsSync(path.join(configDirectory, '.mcp.json'))).toBe(false);
  expect(fs.existsSync(path.join(configDirectory, 'AGENTS.md'))).toBe(false);
});

test('init refuses to run when a lowdefy.yaml already exists', async () => {
  fs.writeFileSync(path.join(configDirectory, 'lowdefy.yaml'), 'lowdefy: 1.0.0\n');

  await expect(init({ context })).rejects.toThrow(
    'Cannot initialize a Lowdefy project, a "lowdefy.yaml" file already exists'
  );
  expect(fs.existsSync(path.join(configDirectory, 'pages'))).toBe(false);
});

test('init keeps a file the project already has instead of overwriting it', async () => {
  fs.writeFileSync(path.join(configDirectory, 'README.md'), '# my own readme\n');

  await init({ context });

  expect(read('README.md')).toEqual('# my own readme\n');
  expect(context.logger.info).toHaveBeenCalledWith("Skipped 'README.md', it already exists.");
});

test('the build fixture 105-init-app is the rendered templates, so the starter app is compiled by CI', () => {
  configTemplateFiles.forEach((template) => {
    const rendered = renderTemplate({
      template: fs.readFileSync(path.join(templatesDirectory, template), 'utf8'),
      values: { LOWDEFY_VERSION: 'local', APP_NAME: 'init-app' },
    });
    expect({
      [template]: fs.readFileSync(path.join(buildFixtureDirectory, template), 'utf8'),
    }).toEqual({ [template]: rendered });
  });
});

test('the starter journeys and request tests are valid against the journey grammar', async () => {
  const { validateJourney, validateRequestTest } = await import('@lowdefy/node-utils');
  await init({ context });

  YAML.parse(read('tests/journeys/items-list.yaml')).forEach((journey) => {
    expect({ [journey.name]: validateJourney({ journey }) }).toEqual({
      [journey.name]: { valid: true },
    });
  });
  YAML.parse(read('tests/requests/add-item.test.yaml')).forEach((test) => {
    expect({ [test.name]: validateRequestTest({ test }) }).toEqual({
      [test.name]: { valid: true },
    });
  });
});

test('the starter fixture seeds the items connection with three documents', async () => {
  const { readFixture } = await import('@lowdefy/node-utils');
  await init({ context });

  const fixture = await readFixture({ configDirectory, name: 'items' });
  expect(fixture.connections).toHaveLength(1);
  expect(fixture.connections[0].connectionId).toEqual('items');
  expect(fixture.connections[0].docs.map((doc) => doc.title)).toEqual([
    'Read the docs',
    'Run lowdefy test',
    'Ship something',
  ]);
});
