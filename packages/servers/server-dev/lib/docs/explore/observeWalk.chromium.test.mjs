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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { jest } from '@jest/globals';

// A real Chromium against a static page that renders the markup Lowdefy
// blocks render (bl-<blockId> wrappers, antd Select, ag-grid rows) with a
// stand-in window.lowdefy and the engine's real trace registry, bundled from
// @lowdefy/engine. So targets are described by the engine's describeElement
// and resolved by the journey runner's own runSteps, as on a dev page.
// Skipped when no Chromium can be launched.
jest.unstable_mockModule('../../build/config.js', () => ({ default: {} }));
jest.setTimeout(60000);

const { getBrowser } = await import('../getBrowser.js');
const { default: runSteps } = await import('../runJourneySteps.js');
const { default: observeWalk } = await import('./observeWalk.js');

const serverDevDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Bundled by Vite in a child process: Jest's resolver cannot load Vite.
function bundleTrace() {
  const engine = fs.realpathSync(
    path.join(serverDevDirectory, 'node_modules', '@lowdefy', 'engine')
  );
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-trace-'));
  const entry = path.join(directory, 'entry.js');
  const outFile = path.join(directory, 'trace.js');
  // Forward slashes, JSON-quoted: a Windows path in a quoted specifier reads its backslashes as
  // escapes.
  const getTracePath = path.join(engine, 'dist', 'trace', 'getTrace.js').split(path.sep).join('/');
  fs.writeFileSync(
    entry,
    `import getTrace from ${JSON.stringify(getTracePath)};\nwindow.__lowdefyGetTrace = getTrace;\n`
  );
  const script = `
    import fs from 'node:fs';
    import { build } from 'vite';
    const output = await build({
      configFile: false,
      logLevel: 'silent',
      root: ${JSON.stringify(serverDevDirectory)},
      build: { write: false, minify: false, lib: { entry: ${JSON.stringify(
        entry
      )}, formats: ['iife'], name: 'LowdefyTrace' } },
    });
    fs.writeFileSync(${JSON.stringify(outFile)}, output[0].output[0].code);
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: serverDevDirectory,
  });
  const code = fs.readFileSync(outFile, 'utf8');
  fs.rmSync(directory, { recursive: true, force: true });
  return code;
}

const BLOCKS = {
  assign_button: { type: 'Button', valueType: null, properties: { title: 'Assign' } },
  disabled_button: { type: 'Button', valueType: null },
  hidden_button: { type: 'Button', valueType: null },
  invisible_button: { type: 'Button', valueType: null },
  aria_disabled: { type: 'Button', valueType: null },
  docs_link: { type: 'Anchor', valueType: null },
  new_tab: { type: 'Anchor', valueType: null },
  details_link: { type: 'Anchor', valueType: null },
  title: {
    type: 'TextInput',
    valueType: 'string',
    required: true,
    properties: { label: { title: 'Title' }, maxLength: 120 },
  },
  count: {
    type: 'NumberInput',
    valueType: 'number',
    properties: { title: 'Count', min: 1, max: 9 },
    validate: [{ pass: true }],
  },
  due: { type: 'DateSelector', valueType: 'date' },
  meta: { type: 'JsonInput', valueType: 'object' },
  assignee: {
    type: 'Selector',
    valueType: 'string',
    properties: {
      title: 'Assignee',
      options: ['Grace Hopper', { label: 'Alan Turing', value: 'a' }],
    },
  },
  priority: {
    type: 'RadioSelector',
    valueType: 'string',
    properties: { options: ['Low', 'High'] },
  },
  send_invite: { type: 'Button', valueType: null },
  logout: { type: 'Button', valueType: null },
  tickets_grid: { type: 'AgGridAlpine', valueType: null },
  open_modal: { type: 'Button', valueType: null },
  increment: { type: 'Button', valueType: null },
  modal_save: { type: 'Button', valueType: null },
};

const BODY = `
<div id="bl-assign_button"><button data-name="Assign">Assign</button></div>
<div id="bl-disabled_button"><button data-name="Disabled" disabled>Disabled</button></div>
<div id="bl-hidden_button"><button data-name="Hidden" style="display:none">Hidden</button></div>
<div id="bl-invisible_button"><button data-name="Invisible" style="visibility:hidden">Invisible</button></div>
<div id="bl-aria_disabled"><div role="button" data-name="Nope" aria-disabled="true">Nope</div></div>
<div id="bl-docs_link"><a data-name="Docs" href="https://example.com/docs">Docs</a></div>
<div id="bl-new_tab"><a data-name="Help" href="/help" target="_blank">Help</a></div>
<div id="bl-details_link"><a data-name="Details" href="#details">Details</a></div>
<div id="bl-title"><input data-name="title" type="text"></div>
<div id="bl-count"><input data-name="count" type="text"></div>
<div id="bl-due"><input data-name="due" type="text"></div>
<div id="bl-meta"><textarea data-name="meta"></textarea></div>
<div id="bl-assignee"><div class="ant-select"><input data-name="assignee" role="combobox" readonly></div></div>
<div id="bl-priority">
  <label data-name="Low"><input type="radio" name="p">Low</label>
  <label data-name="High"><input type="radio" name="p">High</label>
</div>
<div id="bl-send_invite"><button data-name="Send invite">Send invite</button></div>
<div id="bl-logout"><button data-name="Log out">Log out</button></div>
<div id="bl-tickets_grid">
  <div class="ag-row" row-index="0"><div class="ag-cell" col-id="name"><button data-name="Grace Hopper">Grace Hopper</button></div><div class="ag-cell" col-id="status">Open</div></div>
  <div class="ag-row" row-index="1"><div class="ag-cell" col-id="name"><button data-name="Jane Staging">Jane Staging</button></div></div>
</div>
<div id="bl-open_modal"><button data-name="Open" onclick="document.getElementById('edit_modal').style.display='block'">Open</button></div>
<div id="bl-increment"><button data-name="Increment" onclick="window.lowdefy.contexts['page:tickets'].state.clicks += 1">Increment</button></div>
<div role="dialog" id="edit_modal" style="display:none"><div id="bl-modal_save"><button data-name="Save">Save</button></div></div>
`;

function pageScript() {
  const map = Object.fromEntries(
    Object.entries(BLOCKS).map(([blockId, block]) => [
      blockId,
      {
        type: block.type,
        meta: { valueType: block.valueType },
        eval: { properties: block.properties ?? {}, required: block.required ?? false },
        validate: block.validate ?? [],
      },
    ])
  );
  return `
    window.lowdefy = {
      pageId: 'tickets',
      basePath: '',
      pageInstances: { tickets: ['page:tickets'] },
      contexts: {
        'page:tickets': {
          pageId: 'tickets',
          state: { clicks: 0, title: null },
          requests: {},
          _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: ${JSON.stringify(
            map
          )} } },
        },
      },
    };
    window.__lowdefyGetTrace(window.lowdefy);
    document.querySelector('#bl-title input').addEventListener('input', (event) => {
      window.lowdefy.contexts['page:tickets'].state.title = event.target.value;
    });
    window.__clicked = [];
    document.addEventListener('click', (event) => {
      const named = event.target.closest('[data-name]');
      if (named) window.__clicked.push(named.dataset.name);
    }, true);
  `;
}

let server;
let origin;
let traceBundle;
let browser = null;
try {
  browser = await getBrowser();
} catch {
  browser = null;
}
const chromiumTest = browser === null ? test.skip : test;

beforeAll(async () => {
  traceBundle = bundleTrace();
  server = http.createServer((req, res) => {
    if (req.url.startsWith('/tickets')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        `<!doctype html><html><head><title>tickets</title></head><body>${BODY}<script>${traceBundle}</script><script>${pageScript()}</script></body></html>`
      );
      return;
    }
    if (req.url === '/no-trace') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><html><body><button>Lonely</button></body></html>');
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

const knownTexts = new Set(['Grace Hopper', 'Assign', 'Title']);
const knownText = {
  has: (text) => knownTexts.has(text),
  findIn: (text) => [...knownTexts].find((known) => (text ?? '').includes(known)) ?? null,
};

const snapshotWalk = {
  pageId: 'tickets',
  externalBlocks: { send_invite: ['mailer'] },
  authActionBlocks: ['logout'],
  allowExternal: [],
  knownText,
  snapshot: true,
};

async function withPage(callback) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/tickets`);
    return await callback(page);
  } finally {
    await context.close();
  }
}

function summary(observation) {
  return observation.candidates.map((candidate) => [candidate.kind, candidate.target]);
}

chromiumTest('observeWalk lists what a walk may do and counts what it leaves out', async () => {
  const observation = await withPage((page) =>
    observeWalk({ page, walk: snapshotWalk, open: true })
  );
  expect(observation).toMatchObject({
    pageId: 'tickets',
    url: '/tickets',
    ready: true,
    redirected: false,
    excluded: {
      dateOrObjectInput: 2,
      externalLink: 2,
      externalConnection: ['send_invite'],
      authAction: 1,
      snapshotRow: 1,
    },
  });
  expect(observation.shape).toMatch(/^[0-9a-f]{8}$/);
  expect(summary(observation)).toEqual([
    ['click', { blockId: 'assign_button', text: 'Assign' }],
    ['click', { blockId: 'details_link', text: 'Details' }],
    ['fill', { blockId: 'title' }],
    ['fill', { blockId: 'count' }],
    ['select', { blockId: 'assignee' }],
    ['click', { blockId: 'priority', text: 'Low' }],
    ['click', { blockId: 'priority', text: 'High' }],
    ['click', { blockId: 'tickets_grid', row: 0, column: 'name', text: 'Grace Hopper' }],
    ['click', { blockId: 'open_modal', text: 'Open' }],
    ['click', { blockId: 'increment', text: 'Increment' }],
  ]);
  expect(observation.candidates.map((candidate) => candidate.id)).toEqual(
    observation.candidates.map((_, index) => `c${index}`)
  );
  const grid = observation.candidates.find((candidate) => candidate.target.row === 0);
  expect(grid.rowText).toEqual('Grace Hopper');
});

chromiumTest(
  'observeWalk offers allowed external controls and every row on a fixtures-only data set',
  async () => {
    const observation = await withPage((page) =>
      observeWalk({
        page,
        walk: { ...snapshotWalk, allowExternal: ['mailer'], snapshot: false },
      })
    );
    expect(observation.excluded.externalConnection).toEqual([]);
    expect(observation.excluded.snapshotRow).toEqual(0);
    expect(observation.redirected).toBeUndefined();
    const targets = observation.candidates.map((candidate) => candidate.target);
    expect(targets).toContainEqual({ blockId: 'send_invite', text: 'Send invite' });
    expect(targets).toContainEqual({
      blockId: 'tickets_grid',
      row: 1,
      column: 'name',
      text: 'Jane Staging',
    });
  }
);

chromiumTest(
  'observeWalk gives a fill its input limits and a select its option labels',
  async () => {
    const observation = await withPage((page) => observeWalk({ page, walk: snapshotWalk }));
    const byBlock = Object.fromEntries(
      observation.candidates.map((candidate) => [candidate.target.blockId, candidate])
    );
    expect(byBlock.title).toMatchObject({
      kind: 'fill',
      blockType: 'TextInput',
      label: 'Title',
      input: {
        valueType: 'string',
        required: true,
        maxLength: 120,
        min: null,
        max: null,
        hasValidate: false,
      },
    });
    expect(byBlock.count.input).toEqual({
      valueType: 'number',
      required: false,
      maxLength: null,
      min: 1,
      max: 9,
      hasValidate: true,
    });
    expect(byBlock.assignee).toMatchObject({
      kind: 'select',
      label: 'Assignee',
      options: ['Grace Hopper', 'Alan Turing'],
    });
  }
);

chromiumTest(
  'every listed click target, run back through runSteps, clicks the element it was listed from',
  async () => {
    const observation = await withPage((page) =>
      observeWalk({ page, walk: { ...snapshotWalk, snapshot: false, allowExternal: ['mailer'] } })
    );
    const clicks = observation.candidates.filter((candidate) => candidate.kind === 'click');
    expect(clicks.length).toBeGreaterThan(5);
    for (const candidate of clicks) {
      const clicked = await withPage(async (page) => {
        const journey = {
          actors: {
            current: () => ({ page }),
            sampleRendered: async () => {},
            leftOrigin: () => undefined,
          },
          stepTimeout: 2000,
        };
        const { failure } = await runSteps({ journey, steps: [{ click: candidate.target }] });
        expect(failure).toBeUndefined();
        return page.evaluate(() => [...new Set(window.__clicked)]);
      });
      expect(clicked).toEqual([candidate.target.text ?? candidate.target.blockId]);
    }
  }
);

chromiumTest(
  'the shape ignores values and the action taken, and changes when a modal opens',
  async () => {
    await withPage(async (page) => {
      const journey = {
        actors: {
          current: () => ({ page }),
          sampleRendered: async () => {},
          leftOrigin: () => undefined,
        },
        stepTimeout: 2000,
      };
      const before = await observeWalk({ page, walk: snapshotWalk });
      await runSteps({ journey, steps: [{ click: { blockId: 'increment', text: 'Increment' } }] });
      const afterClick = await observeWalk({ page, walk: snapshotWalk });
      await runSteps({ journey, steps: [{ fill: { blockId: 'title', value: 'First title' } }] });
      const afterFill = await observeWalk({ page, walk: snapshotWalk });
      await runSteps({ journey, steps: [{ fill: { blockId: 'title', value: 'Another title' } }] });
      const afterRefill = await observeWalk({ page, walk: snapshotWalk });
      expect(afterClick.shape).toEqual(before.shape);
      expect(afterRefill.shape).toEqual(afterFill.shape);
      await runSteps({ journey, steps: [{ click: { blockId: 'open_modal', text: 'Open' } }] });
      const inModal = await observeWalk({ page, walk: snapshotWalk });
      expect(inModal.shape).not.toEqual(before.shape);
      expect(summary(inModal)).toEqual([['click', { blockId: 'modal_save', text: 'Save' }]]);
    });
  }
);

chromiumTest('observeWalk fails a page with no trace registry', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/no-trace`);
    await expect(observeWalk({ page, walk: snapshotWalk })).rejects.toThrow(
      'The walk page has no Lowdefy trace registry (window.lowdefy._trace)'
    );
  } finally {
    await context.close();
  }
});
