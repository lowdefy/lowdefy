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
import { jest } from '@jest/globals';
import YAML from 'yaml';

import expand from './expand.js';

// A page as the build writes it: prefixed block ids, areas moved into slots,
// events normalised to try/catch, arrays as ~arr and build markers throughout.
const builtPage = {
  id: 'page:controls',
  type: 'Box',
  properties: { '~k': '1g' },
  pageId: 'controls',
  blockId: 'controls',
  events: {
    onInitAsync: {
      try: { '~arr': [{ id: 'reload_list', type: 'Request', params: 'list', '~k': '1l' }] },
      catch: { '~arr': [] },
    },
  },
  slots: {
    content: {
      blocks: {
        '~arr': [
          {
            id: 'block:controls:header:0',
            type: 'Box',
            blockId: 'header',
            '~k': '1t',
            slots: {
              content: {
                blocks: {
                  '~arr': [
                    {
                      id: 'block:controls:list_title:0',
                      type: 'Title',
                      blockId: 'list_title',
                      properties: { content: 'Controls', '~k': '1z' },
                    },
                  ],
                },
              },
            },
          },
          {
            id: 'block:controls:load_error:0',
            type: 'Result',
            blockId: 'load_error',
            properties: { status: 'error' },
            slots: {
              extra: {
                blocks: {
                  '~arr': [
                    {
                      id: 'block:controls:retry_list:0',
                      type: 'Button',
                      blockId: 'retry_list',
                      events: {
                        onClick: {
                          try: { '~arr': [{ id: 'reload_list', type: 'Request', params: 'list' }] },
                          catch: { '~arr': [{ id: 'log', type: 'Message', params: 'failed' }] },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  },
  subscriptions: { '~arr': [] },
  requests: { '~arr': [{ id: 'request:controls:list', requestId: 'list', pageId: 'controls' }] },
};

const builtRequest = {
  id: 'request:controls:list',
  type: 'MongoDBFind',
  connectionId: 'controls',
  payload: { search: { _state: 'filters.search', '~k': '4r' } },
  properties: { query: { '~k': '4t' }, '~k': '4s' },
  auth: { public: true },
  requestId: 'list',
  pageId: 'controls',
};

let configDirectory;
let buildDirectory;
let context;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-expand-'));
  buildDirectory = path.join(configDirectory, '.lowdefy', 'server', 'build');
  fs.mkdirSync(path.join(buildDirectory, 'pages', 'controls', 'requests'), { recursive: true });
  fs.writeFileSync(path.join(buildDirectory, 'pages', 'controls.json'), JSON.stringify(builtPage));
  fs.writeFileSync(
    path.join(buildDirectory, 'pages', 'controls', 'requests', 'list.json'),
    JSON.stringify(builtRequest)
  );
  context = {
    directories: { config: configDirectory, build: buildDirectory },
    logger: { info: jest.fn(), succeed: jest.fn(), error: jest.fn(), warn: jest.fn() },
    options: {},
    sendTelemetry: jest.fn(),
  };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function readWrittenPage() {
  const written = fs.readFileSync(path.join(configDirectory, 'pages', 'controls.yaml'), 'utf8');
  return { written, page: YAML.parse(written) };
}

test('expand writes the built page back as authorable config', async () => {
  await expand({ context, params: ['controls'] });
  const { page } = readWrittenPage();
  expect(page.id).toBe('controls');
  expect(page.type).toBe('Box');
  expect(page.blocks[0].id).toBe('header');
  expect(page.blocks[0].blocks[0].id).toBe('list_title');
  expect(page.blocks[0].blocks[0].properties).toEqual({ content: 'Controls' });
});

test('expand strips every build marker and derived key', async () => {
  await expand({ context, params: ['controls'] });
  const { written } = readWrittenPage();
  expect(written).not.toMatch(/~k|~r|~l|~c|~x|~arr/);
  expect(written).not.toMatch(/blockId|pageId|block:controls|page:controls|request:controls/);
});

test('expand writes a bare action list for an event with no catch, and try/catch otherwise', async () => {
  await expand({ context, params: ['controls'] });
  const { page } = readWrittenPage();
  expect(page.events.onInitAsync).toEqual([{ id: 'reload_list', type: 'Request', params: 'list' }]);
  const retry = page.blocks[1].areas.extra.blocks[0];
  expect(retry.events.onClick).toEqual({
    try: [{ id: 'reload_list', type: 'Request', params: 'list' }],
    catch: [{ id: 'log', type: 'Message', params: 'failed' }],
  });
});

test('expand writes the full request config under the id the author wrote', async () => {
  await expand({ context, params: ['controls'] });
  const { page } = readWrittenPage();
  expect(page.requests).toEqual([
    {
      id: 'list',
      type: 'MongoDBFind',
      connectionId: 'controls',
      payload: { search: { _state: 'filters.search' } },
      properties: { query: {} },
    },
  ]);
});

test('expand drops an empty subscriptions list and empty page properties', async () => {
  await expand({ context, params: ['controls'] });
  const { page } = readWrittenPage();
  expect(page.subscriptions).toBeUndefined();
  expect(page.properties).toBeUndefined();
});

test('expand refuses to overwrite an existing file without confirmation', async () => {
  const outputPath = path.join(configDirectory, 'pages', 'controls.yaml');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, 'id: controls\n');
  await expect(expand({ context, params: ['controls'] })).rejects.toThrow(
    /would overwrite .*controls.yaml, but stdin is not interactive/
  );
  expect(fs.readFileSync(outputPath, 'utf8')).toBe('id: controls\n');
});

test('expand overwrites an existing file with --yes', async () => {
  const outputPath = path.join(configDirectory, 'pages', 'controls.yaml');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, 'id: controls\n');
  context.options = { yes: true };
  await expand({ context, params: ['controls'] });
  expect(fs.readFileSync(outputPath, 'utf8')).toMatch(/Expanded by "lowdefy expand"/);
});

test('expand errors when the page has not been built', async () => {
  await expect(expand({ context, params: ['missing'] })).rejects.toThrow(
    /No built page "missing" found .* Run "lowdefy build" first/s
  );
});

test('expand errors when no page id is given', async () => {
  await expect(expand({ context, params: [] })).rejects.toThrow(
    'lowdefy expand needs a page id: "lowdefy expand <pageId>".'
  );
});
