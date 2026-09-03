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
import path from 'path';
import { execFileSync } from 'child_process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import setupTestFixtures from './setupTestFixtures.mjs';

// getAppBrief reads build artifacts and config from process.cwd() — point it at
// the fixture app before the modules are imported, as dataModel.test.mjs does.
const fixtureDir = setupTestFixtures();

function write(relativePath, data) {
  const filePath = path.join(fixtureDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

// The home page calls the submit_answer endpoint from a button, so the brief has
// a page -> endpoint -> collection chain to follow.
const homePage = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'build/pages/home.json')));
homePage.blocks[0].events = {
  onClick: {
    try: [
      {
        ':if': { _state: 'valid' },
        ':then': [
          { id: 'submit', type: 'CallAPI', params: { endpointId: 'submit_answer' } },
          { id: 'dynamic', type: 'CallAPI', params: { endpointId: { _state: 'endpoint' } } },
        ],
      },
    ],
    catch: [],
  },
};
write('build/pages/home.json', homePage);

write('build/journeyCoverage.json', {
  pages: {
    home: {
      events: [
        { blockId: 'my_button', event: 'onClick' },
        { blockId: 'card', event: 'onMount' },
      ],
      requestIds: ['get_answers', 'answers_report'],
    },
    other: { events: [{ blockId: 'my_button', event: 'onClick' }], requestIds: [] },
    legal: { events: [], requestIds: [] },
    unbuilt: { events: [], requestIds: [] },
  },
});

write(
  'tests/journeys/home.yaml',
  ['name: submit an answer', 'pageId: home', 'steps:', '  - click: my_button', ''].join('\n')
);
write(
  'tests/requests/answers.test.yaml',
  ['name: insert an answer', 'endpointId: submit_answer', 'expect: {}', ''].join('\n')
);
write('.lowdefy/test/journeyIndex.json', { pages: { home: ['submit an answer'] } });

// The config files refMap points at, so a git diff has something to name.
write('pages/home.yaml', 'id: home\n');
write('pages/other.yaml', 'id: other\n');
write('pages/legal.yaml', 'id: legal\n');
write('api/submit.yaml', 'id: submit_answer\n');
write('websockets.yaml', 'id: answers_stream\n');

const git = (args) => execFileSync('git', args, { cwd: fixtureDir, encoding: 'utf8' });
git(['init', '--initial-branch=main']);
git(['config', 'user.email', 'test@example.com']);
git(['config', 'user.name', 'Test']);
git(['add', '-A']);
git(['commit', '-m', 'fixture']);

process.chdir(fixtureDir);

const { default: getAppBrief } = await import('./getAppBrief.js');
const { default: getChangedConfigFiles } = await import('./getChangedConfigFiles.js');
const { default: createDocsMcpServer } = await import('./createDocsMcpServer.js');
const { default: docsAppBriefHandler } = await import('../../src/routes/docs/appBrief.js');

const registryPath = path.join(fixtureDir, 'build', 'pageRegistry.json');
const registry = fs.readFileSync(registryPath, 'utf8');

afterEach(() => {
  fs.writeFileSync(registryPath, registry);
  git(['checkout', '--', '.']);
});

test('getAppBrief reports what a page reads and writes through its own requests', () => {
  const brief = getAppBrief({ pageId: 'home' });

  expect(brief.pageId).toBe('home');
  expect(brief.file).toBe('pages/home.yaml');
  expect(brief.built).toBe(true);
  expect(brief.reads).toContainEqual({
    collection: 'answers',
    by: [
      { requestId: 'get_answers', type: 'MongoDBFind', via: 'request' },
      { requestId: 'answers_report', type: 'MongoDBAggregation', via: 'request' },
    ],
  });
  // The aggregation's literal $merge is a write, classified by getDataModel.
  expect(brief.writes).toContainEqual({
    collection: 'reports',
    by: [{ requestId: 'answers_report', type: 'MongoDBAggregation', via: '$merge' }],
  });
});

test('getAppBrief reports the endpoints a page calls and what those endpoints write', () => {
  const brief = getAppBrief({ pageId: 'home' });

  expect(brief.endpoints).toEqual([
    {
      endpointId: 'submit_answer',
      calledFrom: [{ blockId: 'my_button', event: 'onClick' }],
      reads: [],
      writes: [
        {
          collection: 'answers',
          by: [{ stepId: 'insert', type: 'MongoDBInsertOne', via: 'step' }],
        },
      ],
    },
  ]);
  // An operator-valued endpointId names no endpoint at build — reported, not guessed.
  expect(brief.dynamicEndpointCalls).toEqual([
    { actionId: 'dynamic', blockId: 'my_button', event: 'onClick' },
  ]);
});

test('getAppBrief carries through the requests getDataModel could not join to a collection', () => {
  const brief = getAppBrief({ pageId: 'home' });
  expect(brief.unresolved.map((entry) => entry.requestId)).toEqual(
    expect.arrayContaining(['req-orphan', 'req-dynamic', 'req-ghost'])
  );
});

test('getAppBrief names the journeys and request tests covering a page', () => {
  const brief = getAppBrief({ pageId: 'home' });

  expect(brief.tests.journeys).toEqual(['submit an answer']);
  expect(brief.tests.requestTests).toEqual([
    {
      file: path.join('tests', 'requests', 'answers.test.yaml'),
      name: 'insert an answer',
      requestId: null,
      endpointId: 'submit_answer',
    },
  ]);
});

test('getAppBrief reports the declared event and request triples no journey covers', () => {
  const brief = getAppBrief({ pageId: 'home' });

  expect(brief.tests.events).toEqual({
    declared: 4,
    covered: 1,
    uncovered: [
      { blockId: 'card', event: 'onMount' },
      { blockId: 'get_answers', event: 'request' },
      { blockId: 'answers_report', event: 'request' },
    ],
  });
});

test('getAppBrief computes covering journeys from the journey files when the index is absent', () => {
  const indexPath = path.join(fixtureDir, '.lowdefy', 'test', 'journeyIndex.json');
  const saved = fs.readFileSync(indexPath, 'utf8');
  fs.rmSync(indexPath);

  expect(getAppBrief({ pageId: 'home' }).tests.journeys).toEqual(['submit an answer']);

  fs.writeFileSync(indexPath, saved);
});

test('getAppBrief maps a changed config file onto the blocks and requests it defines', () => {
  fs.writeFileSync(path.join(fixtureDir, 'pages', 'home.yaml'), 'id: home\ntitle: changed\n');
  const brief = getAppBrief({ pageId: 'home', since: 'HEAD' });

  expect(brief.since).toBe('HEAD');
  expect(brief.changed.changed).toBe(true);
  expect(brief.changed.files).toEqual(['pages/home.yaml']);
  // Only blocks the built page artifact actually carries: a keyMap entry no
  // built block references defines nothing on this page.
  expect(brief.changed.blocks).toEqual(['my_button']);
  expect(brief.changed.requests).toEqual(['answers_report', 'get_answers']);
  expect(brief.changed.endpoints).toEqual([]);
});

test('getAppBrief reports a page as changed when an endpoint it calls changed', () => {
  fs.writeFileSync(path.join(fixtureDir, 'api', 'submit.yaml'), 'id: submit_answer\nx: 1\n');
  const brief = getAppBrief({ pageId: 'home', since: 'HEAD' });

  expect(brief.changed.files).toEqual(['api/submit.yaml']);
  expect(brief.changed.endpoints).toEqual(['submit_answer']);
  expect(brief.changed.blocks).toEqual([]);
});

test('getAppBrief reports no change when nothing the page is made of changed', () => {
  fs.writeFileSync(path.join(fixtureDir, 'pages', 'legal.yaml'), 'id: legal\nx: 1\n');
  const brief = getAppBrief({ pageId: 'home', since: 'HEAD' });

  expect(brief.changed).toEqual({
    changed: false,
    files: [],
    blocks: [],
    requests: [],
    endpoints: [],
  });
});

test('getAppBrief rejects a since that is not a git ref rather than passing it to git', () => {
  expect(getAppBrief({ pageId: 'home', since: '--upload-pack=touch /tmp/pwned' }).error).toContain(
    'is not a git ref'
  );
  expect(getAppBrief({ pageId: 'home', since: 'HEAD; rm -rf /' }).error).toContain(
    'is not a git ref'
  );
  expect(getChangedConfigFiles({ since: '', configDirectory: fixtureDir }).error).toContain(
    'is not a git ref'
  );
  // A ref-shaped value is spawned and answered by git itself.
  expect(getChangedConfigFiles({ since: 'HEAD~99', configDirectory: fixtureDir }).error).toContain(
    'git diff HEAD~99 failed'
  );
});

test('getAppBrief returns an error naming the known pages for an unknown pageId', () => {
  expect(getAppBrief({ pageId: 'nope' }).error).toBe(
    'Page "nope" was not found. Known pages: home, legal, other, unbuilt.'
  );
});

test('getAppBrief without a pageId summarizes every page in one line each', () => {
  const brief = getAppBrief();

  expect(brief.app).toEqual({
    pages: 4,
    collections: 6,
    endpoints: 1,
    journeys: 1,
    requestTests: 1,
  });
  expect(brief.pages[0]).toEqual({
    pageId: 'home',
    file: 'pages/home.yaml',
    reads: ['answers', 'archive', 'audit_log', 'controls', 'evidence'],
    writes: ['reports', 'answers'],
    endpoints: ['submit_answer'],
    journeys: 1,
    events: '1/4',
  });
  expect(brief.unbuiltPages).toEqual(['unbuilt']);
  expect(brief.truncated).toBeUndefined();
});

test('getAppBrief without a pageId lists the changed pages and orders them first', () => {
  fs.writeFileSync(path.join(fixtureDir, 'pages', 'other.yaml'), 'id: other\nx: 1\n');
  const brief = getAppBrief({ since: 'HEAD' });

  expect(brief.changed.since).toBe('HEAD');
  expect(brief.changed.files).toEqual(['pages/other.yaml']);
  expect(brief.changed.pages).toEqual(['other']);
  expect(brief.pages[0].pageId).toBe('other');
  expect(brief.pages[0].changed).toBe(true);
});

test('getAppBrief caps the app brief and says how many pages are not listed', async () => {
  const { MAX_PAGES } = await import('./getAppBrief.js');
  const many = JSON.parse(registry);
  for (let index = 0; index < MAX_PAGES + 10; index += 1) {
    const pageId = `page_${String(index).padStart(3, '0')}`;
    many[pageId] = { pageId, auth: null, refId: 'ref-home', refPath: `pages/${pageId}.yaml` };
  }
  fs.writeFileSync(registryPath, JSON.stringify(many));

  const brief = getAppBrief();

  expect(brief.app.pages).toBe(MAX_PAGES + 14);
  expect(brief.pages).toHaveLength(MAX_PAGES);
  expect(brief.truncated.pages).toBe(14);
  expect(brief.truncated.note).toContain('14 of 64 pages are not listed');
  expect(brief.markdown).toContain('14 of 64 pages are not listed');
});

test('getAppBrief renders the same brief as compact markdown', () => {
  const brief = getAppBrief({ pageId: 'home' });

  expect(brief.markdown).toContain('# Page `home` — pages/home.yaml');
  expect(brief.markdown).toContain('- `answers` — get_answers (MongoDBFind)');
  expect(brief.markdown).toContain(
    '- `submit_answer` (from my_button.onClick) — reads none; writes answers'
  );
  expect(brief.markdown).toContain('- journeys: submit an answer');
  expect(brief.markdown).toContain('- events covered: 1/4');
  expect(getAppBrief().markdown).toContain('| page | reads | writes | endpoints |');
});

test('getAppBrief names a page that has not been built yet instead of reporting no data', () => {
  const brief = getAppBrief({ pageId: 'unbuilt' });
  expect(brief.built).toBe(false);
  expect(brief.reads).toEqual([]);
  expect(brief.note).toContain('has not been built yet');
});

test('GET /lowdefy-docs/app-brief and the lowdefy_app_brief MCP tool return the same brief', async () => {
  const server = createDocsMcpServer({ origin: 'http://localhost:3240' });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const tools = await client.listTools();
  const tool = tools.tools.find((entry) => entry.name === 'lowdefy_app_brief');
  expect(tool).toBeDefined();
  expect(tool.description).toContain('no prose');

  const mcpResult = await client.callTool({
    name: 'lowdefy_app_brief',
    arguments: { pageId: 'home' },
  });
  const { markdown, ...expected } = getAppBrief({ pageId: 'home' });
  expect(mcpResult.content[0].text).toEqual(markdown);
  expect(JSON.parse(mcpResult.content[1].text)).toEqual(expected);

  let fromRest;
  let status;
  await docsAppBriefHandler({
    req: { param: () => 'home', query: () => undefined },
    json: (data, code) => {
      fromRest = data;
      status = code;
      return data;
    },
  });
  expect(status).toBeUndefined();
  expect(fromRest).toEqual({ ...expected, markdown });

  const badResult = await client.callTool({
    name: 'lowdefy_app_brief',
    arguments: { pageId: 'nope' },
  });
  expect(badResult.isError).toBe(true);

  await docsAppBriefHandler({
    req: { param: () => 'nope', query: () => undefined },
    json: (data, code) => {
      fromRest = data;
      status = code;
      return data;
    },
  });
  expect(status).toBe(400);
  expect(fromRest.error).toContain('was not found');

  await client.close();
});
