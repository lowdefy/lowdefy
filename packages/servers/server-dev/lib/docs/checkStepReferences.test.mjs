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

// getPageConfig JIT-builds a page the journey has not visited; here the
// fixture build already holds every page it knows.
const mockGetPageConfig = jest.fn(async ({ pageId }) =>
  ['home', 'second'].includes(pageId) ? {} : null
);
jest.unstable_mockModule('./getPageConfig.js', () => ({ default: mockGetPageConfig }));

const { default: checkStepReferences } = await import('./checkStepReferences.js');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-check-step-references-'));
const previousCwd = process.cwd();

function write(name, value) {
  const filePath = path.join(directory, 'build', name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

beforeAll(() => {
  write('pageRegistry.json', { home: {}, second: {} });
  write('pages/home.json', {
    id: 'page:home',
    blockId: 'home',
    pageId: 'home',
    areas: {
      content: {
        blocks: [
          { blockId: 'title' },
          {
            blockId: 'rows',
            areas: { content: { blocks: [{ blockId: 'rows.$.name' }] } },
          },
        ],
      },
    },
  });
  write('pages/home/requests/save_item.json', { requestId: 'save_item' });
  write('pages/second/requests/load.json', { requestId: 'load' });
  write('api/notify.json', { endpointId: 'notify' });
  process.chdir(directory);
});

afterAll(() => {
  process.chdir(previousCwd);
  fs.rmSync(directory, { recursive: true, force: true });
});

// The page's evaluate answers what readShownPage reads from window.lowdefy:
// the shown page's id and the ids of the blocks its engine holds.
function pageShowing(pageId, { blockIds = [] } = {}) {
  return { evaluate: async () => ({ pageId, blockIds }) };
}

function journeyWith(overrides = {}) {
  return { pageId: 'home', mainActor: 'main', dataSetUsers: undefined, ...overrides };
}

async function check(step, { page = pageShowing('home'), journey = journeyWith() } = {}) {
  try {
    await checkStepReferences({ journey, page, step });
    return undefined;
  } catch (error) {
    return error;
  }
}

test.each([
  [{ click: 'title' }],
  [{ fill: { blockId: 'rows.0.name', value: 'x' } }],
  [{ expect: { hidden: { blockId: 'title', containing: 'gone' } } }],
  [{ expect: { visible: 'home' } }],
  [{ click: { text: 'Save' } }],
  [{ wait: { request: 'save_item' } }],
  [{ wait: { ms: 10 } }],
  [{ expect: { calls: { request: 'save_item', count: 0 } } }],
  [{ expect: { calls: { request: 'load', pageId: 'second', count: 0 } } }],
  [{ expect: { calls: { endpoint: 'notify', count: 0 } } }],
  [{ expect: { state: { path: 'anything', equals: null } } }],
  [{ goto: 'second' }],
  [{ goto: { pageId: 'second' } }],
  [{ as: 'anyone' }],
])('checkStepReferences passes %j', async (step) => {
  expect(await check(step)).toBeUndefined();
});

test.each([
  [{ expect: { hidden: 'nosuchblock' } }, 'no block "nosuchblock"'],
  [{ click: { blockId: 'nosuchblock', text: 'Go' } }, 'no block "nosuchblock"'],
  [{ wait: { request: 'nosuchrequest' } }, 'no request "nosuchrequest"'],
  [{ expect: { calls: { request: 'nosuchrequest', count: 0 } } }, 'no request "nosuchrequest"'],
  [
    { expect: { calls: { request: 'save_item', pageId: 'second', count: 0 } } },
    'no request "save_item"',
  ],
  [
    { expect: { calls: { request: 'save_item', pageId: 'nosuchpage', count: 0 } } },
    'no page "nosuchpage"',
  ],
  [{ expect: { calls: { endpoint: 'nosuchendpoint', count: 0 } } }, 'no endpoint "nosuchendpoint"'],
  [{ goto: 'nosuchpage' }, 'no page "nosuchpage"'],
])('checkStepReferences fails %j naming the unknown id', async (step, actual) => {
  const error = await check(step);
  expect(error.name).toBe('JourneyStepError');
  expect(error.actual).toBe(actual);
});

test('checkStepReferences lists the known blocks of a small page', async () => {
  const error = await check({ expect: { hidden: 'nosuchblock' } });
  expect(error.message).toBe(
    'Page "home" has no block "nosuchblock". Known blocks: home, title, rows, rows.$.name.'
  );
});

test('checkStepReferences skips block and request checks when no Lowdefy page shows', async () => {
  const page = { evaluate: async () => null };
  expect(await check({ expect: { hidden: 'nosuchblock' } }, { page })).toBeUndefined();
  expect(await check({ wait: { request: 'nosuchrequest' } }, { page })).toBeUndefined();
});

test('checkStepReferences fails an as name that is not a user of the data set', async () => {
  const journey = journeyWith({ dataSetUsers: { member: {}, owner: {} } });
  const error = await check({ as: 'membr' }, { journey });
  expect(error.actual).toBe('no data set user "membr"');
  expect(error.message).toBe(
    '"as" names "membr", who is neither "main" nor a user of the data set. Known users: member, owner.'
  );
  expect(await check({ as: 'member' }, { journey })).toBeUndefined();
  expect(await check({ as: 'main' }, { journey })).toBeUndefined();
});

test('checkStepReferences accepts a block of the page the journey opened when the app moved elsewhere', async () => {
  const page = pageShowing('second');
  write('pages/second.json', { id: 'page:second', blockId: 'second', pageId: 'second' });
  expect(await check({ expect: { visible: 'title' } }, { page })).toBeUndefined();
  expect(
    await check(
      { expect: { visible: 'refused' } },
      { page, journey: journeyWith({ pageId: 'refused' }) }
    )
  ).toBeUndefined();
  const error = await check({ expect: { visible: 'nosuchblock' } }, { page });
  expect(error.message).toBe('Page "second" has no block "nosuchblock". Known blocks: second.');
});

test('checkStepReferences accepts a block the shown page holds but the build does not name', async () => {
  // A Dynamic block's content is resolved by the server when the page is fetched.
  const page = pageShowing('home', { blockIds: ['title', 'dynamic_content', 'dynamic_save'] });
  expect(await check({ click: 'dynamic_save' }, { page })).toBeUndefined();
  const error = await check({ expect: { hidden: 'nosuchblock' } }, { page });
  expect(error.actual).toBe('no block "nosuchblock"');
});
