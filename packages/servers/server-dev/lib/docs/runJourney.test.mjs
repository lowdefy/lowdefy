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

// getBrowser.js is mocked so no Chromium is needed; the fake page below stands
// in for Playwright's Page. Its `evaluate` runs the callback in this process
// against a `window` global, so the real @lowdefy/e2e-utils helpers (getState,
// getBlock, getShortcutModifier) and isPageReady are exercised, not mocked.
const mockOpenPage = jest.fn();
const mockGetBrowser = jest.fn();
jest.unstable_mockModule('./getBrowser.js', () => ({
  getBrowser: mockGetBrowser,
  openPage: mockOpenPage,
  buildPageUrl: ({ origin, pageId }) => `${origin}/${pageId}`,
}));

const { default: runJourney } = await import('./runJourney.js');

// Node ships a read-only navigator; the page's platform decides Mod, so it is
// replaced with a Mac one for the Mod+k test.
Object.defineProperty(globalThis, 'navigator', {
  value: { platform: 'MacIntel' },
  configurable: true,
});

function createLowdefyWindow({ pageId = 'form', state = {}, requests = {} } = {}) {
  return {
    lowdefy: {
      pageId,
      contexts: {
        [`page:${pageId}`]: {
          state,
          requests,
          websockets: {},
          _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: {} } },
        },
      },
    },
  };
}

function createLocator({ selector, page }) {
  const locator = {
    selector,
    click: jest.fn(async () => {
      if (page.missingBlocks.some((id) => selector === `#bl-${id}`)) {
        throw new Error(
          `locator.click: Timeout 5000ms exceeded.\nCall log:\n\u001b[2m  - waiting for locator('${selector}')\u001b[22m`
        );
      }
      page.clicks.push(selector);
    }),
    fill: jest.fn(async (value) => {
      page.fills.push({ selector, value });
    }),
    locator: jest.fn((child) => createLocator({ selector: `${selector} ${child}`, page })),
    first: jest.fn(() => locator),
    filter: jest.fn(() => locator),
    count: jest.fn(async () => 0),
    selectOption: jest.fn(),
    waitFor: jest.fn(async () => {
      if (page.hiddenBlocks.some((id) => selector === `#bl-${id}`)) {
        throw new Error(`locator.waitFor: Timeout 5000ms exceeded.`);
      }
    }),
    innerText: jest.fn(async () => page.texts[selector] ?? ''),
  };
  return locator;
}

function createPage({ window = createLowdefyWindow(), url = 'http://localhost:3227/form' } = {}) {
  globalThis.window = window;
  const page = {
    clicks: [],
    fills: [],
    presses: [],
    missingBlocks: [],
    hiddenBlocks: [],
    texts: {},
    screenshotCount: 0,
    evaluate: jest.fn(async (fn, arg) => fn(arg)),
    waitForFunction: jest.fn(async (fn, arg) => {
      if (!fn(arg)) {
        throw new Error('waitForFunction: Timeout exceeded.');
      }
    }),
    waitForTimeout: jest.fn(async () => {}),
    waitForURL: jest.fn(async (predicate) => {
      if (!predicate(new URL(url))) {
        throw new Error('page.waitForURL: Timeout exceeded.');
      }
    }),
    url: jest.fn(() => url),
    keyboard: { press: jest.fn(async (key) => page.presses.push(key)) },
    screenshot: jest.fn(async () => {
      page.screenshotCount += 1;
      return Buffer.from(`png-${page.screenshotCount}`);
    }),
  };
  page.locator = jest.fn((selector) => createLocator({ selector, page }));
  return page;
}

function openWith(page, { ready = true } = {}) {
  const context = { close: jest.fn(async () => {}) };
  mockOpenPage.mockResolvedValue({ context, page, ready, url: page.url() });
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBrowser.mockResolvedValue({});
});

const origin = 'http://localhost:3227';

test('runJourney returns an error when origin is missing', async () => {
  const result = await runJourney({ pageId: 'form', steps: [] });
  expect(result.error).toMatch(/requires an "origin" string/);
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

test('runJourney returns an error when pageId is not a string', async () => {
  const result = await runJourney({ origin, pageId: 7, steps: [] });
  expect(result.error).toMatch(/requires a "pageId" string. Received 7/);
});

test('runJourney returns an error when steps is not an array', async () => {
  const result = await runJourney({ origin, pageId: 'form', steps: { click: 'a' } });
  expect(result.error).toMatch(/requires "steps" to be an array/);
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

test('runJourney returns an error naming an unknown step key before opening a browser', async () => {
  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'ok' }, { tap: 'ok' }],
  });
  expect(result.error).toEqual(
    'Step 1: Unknown journey step "tap". Steps are: click, fill, select, press, wait, screenshot, expect.'
  );
  expect(mockGetBrowser).not.toHaveBeenCalled();
  expect(mockOpenPage).not.toHaveBeenCalled();
});

test('runJourney returns an actionable error when no browser is available', async () => {
  mockGetBrowser.mockRejectedValue(new Error("Executable doesn't exist"));
  const result = await runJourney({ origin, pageId: 'form', steps: [] });
  expect(result.error).toMatch(/No Chromium available/);
});

test('runJourney passes user, urlQuery and viewport through to openPage', async () => {
  const page = createPage();
  openWith(page);
  await runJourney({
    origin,
    pageId: 'form',
    steps: [],
    user: { roles: ['admin'] },
    urlQuery: { id: '1' },
    width: 800,
    height: 600,
  });
  expect(mockOpenPage).toHaveBeenCalledWith({
    browser: {},
    origin,
    pageId: 'form',
    user: { roles: ['admin'] },
    urlQuery: { id: '1' },
    width: 800,
    height: 600,
    timeout: 15000,
  });
});

test('runJourney fills, clicks and asserts state, returning passed with the final state', async () => {
  const window = createLowdefyWindow({ state: { name: '', saved: false } });
  const page = createPage({ window });
  const context = openWith(page);
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    if (selector === '#bl-submit') {
      locator.click.mockImplementation(async () => {
        window.lowdefy.contexts['page:form'].state.saved = true;
        page.clicks.push(selector);
      });
    }
    return locator;
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { fill: { blockId: 'name', value: 'Ada' } },
      { click: 'submit' },
      { expect: { state: { path: 'saved', equals: true } } },
    ],
  });

  expect(result.error).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.failure).toBeUndefined();
  expect(page.fills).toEqual([{ selector: '#bl-name input, textarea', value: 'Ada' }]);
  expect(page.clicks).toEqual(['#bl-submit']);
  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'ok', 'ok']);
  expect(result.steps[1]).toMatchObject({ index: 1, step: { click: 'submit' } });
  expect(typeof result.steps[0].durationMs).toBe('number');
  expect(result.state).toEqual({ name: '', saved: true });
  expect(result.screenshots).toEqual([]);
  expect(context.close).toHaveBeenCalledTimes(1);
});

test('runJourney clicks the interactive control inside a block when there is one', async () => {
  const page = createPage();
  openWith(page);
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    locator.locator.mockImplementation((child) => {
      const inner = createLocator({ selector: `${selector} ${child}`, page });
      if (selector === '#bl-submit' && child.startsWith('button')) {
        inner.count.mockResolvedValue(1);
      }
      return inner;
    });
    return locator;
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'submit' }, { click: 'card' }],
  });

  expect(result.passed).toBe(true);
  expect(page.clicks).toEqual([
    `#bl-submit button, [role="button"], a[href], input:not([type="hidden"]), textarea, select, [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"]`,
    '#bl-card',
  ]);
});

test('runJourney reports a missing expect.state value as actual null', async () => {
  const page = createPage({ window: createLowdefyWindow({ state: {} }) });
  openWith(page);
  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ expect: { state: { path: 'saved', equals: true } } }],
  });
  expect(result.failure.actual).toBeNull();
  expect(Object.keys(result.failure)).toContain('actual');
});

test('runJourney fills a numeric value as a string', async () => {
  const page = createPage();
  openWith(page);
  await runJourney({ origin, pageId: 'form', steps: [{ fill: { blockId: 'age', value: 42 } }] });
  expect(page.fills).toEqual([{ selector: '#bl-age input, textarea', value: '42' }]);
});

test('runJourney reports a failing expect.state with expected and actual and skips the rest', async () => {
  const page = createPage({ window: createLowdefyWindow({ state: { count: 1 } }) });
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { state: { path: 'count', equals: 2 } } },
      { click: 'next' },
      { screenshot: 'after' },
    ],
  });

  expect(result.passed).toBe(false);
  expect(result.failure).toEqual({
    index: 0,
    step: { expect: { state: { path: 'count', equals: 2 } } },
    expected: 2,
    actual: 1,
    message: 'Expected state "count" to equal 2 but found 1.',
  });
  expect(result.steps.map((step) => step.status)).toEqual(['failed', 'skipped', 'skipped']);
  expect(page.clicks).toEqual([]);
  expect(result.screenshots).toEqual([]);
  expect(result.state).toEqual({ count: 1 });
});

test('runJourney compares expect.state structurally, ignoring key order', async () => {
  const page = createPage({
    window: createLowdefyWindow({ state: { row: { b: [1, { c: 2 }], a: 'x' } } }),
  });
  openWith(page);
  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ expect: { state: { path: 'row', equals: { a: 'x', b: [1, { c: 2 }] } } } }],
  });
  expect(result.passed).toBe(true);
});

test('runJourney reports a click on a missing block as a failure instead of throwing', async () => {
  const page = createPage();
  page.missingBlocks = ['nope'];
  const context = openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'nope' }, { expect: { visible: 'modal' } }],
  });

  expect(result.error).toBeUndefined();
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(0);
  expect(result.failure.step).toEqual({ click: 'nope' });
  expect(result.failure.expected).toEqual('block "nope" to be actionable');
  expect(result.failure.actual).toEqual(
    "locator.click: Timeout 5000ms exceeded.\nCall log:\n  - waiting for locator('#bl-nope')"
  );
  expect(result.failure.message).toMatch(/Block "nope" was not actionable/);
  expect(result.steps.map((step) => step.status)).toEqual(['failed', 'skipped']);
  expect(context.close).toHaveBeenCalledTimes(1);
});

test('runJourney escapes block ids in the #bl- selector', async () => {
  const page = createPage();
  openWith(page);
  await runJourney({ origin, pageId: 'form', steps: [{ click: 'rows.0.edit' }] });
  expect(page.clicks).toEqual(['#bl-rows\\.0\\.edit']);
});

test('runJourney collects screenshots in step order with default and given names', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ screenshot: 'start' }, { click: 'open' }, { screenshot: true }, { screenshot: null }],
  });

  expect(result.passed).toBe(true);
  expect(result.screenshots).toEqual([
    { name: 'start', data: Buffer.from('png-1').toString('base64'), mimeType: 'image/png' },
    { name: 'step-2', data: Buffer.from('png-2').toString('base64'), mimeType: 'image/png' },
    { name: 'step-3', data: Buffer.from('png-3').toString('base64'), mimeType: 'image/png' },
  ]);
});

test('runJourney keeps screenshots taken before a failing step', async () => {
  const page = createPage();
  page.hiddenBlocks = ['modal'];
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ screenshot: 'before' }, { expect: { visible: 'modal' } }, { screenshot: 'after' }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.expected).toEqual('block "modal" to be visible');
  expect(result.screenshots.map((shot) => shot.name)).toEqual(['before']);
});

test('runJourney resolves Mod in a press chord through getShortcutModifier', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ press: 'Mod+k' }, { press: 'Enter' }],
  });

  expect(result.passed).toBe(true);
  expect(page.presses).toEqual(['Meta+k', 'Enter']);
});

test('runJourney selects a native option by label when the block contains a select', async () => {
  const page = createPage();
  openWith(page);
  let native;
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    locator.locator.mockImplementation((child) => {
      const inner = createLocator({ selector: `${selector} ${child}`, page });
      if (child === 'select') {
        inner.count.mockResolvedValue(1);
        native = inner;
      }
      return inner;
    });
    return locator;
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ select: { blockId: 'country', value: 'Chile' } }],
  });

  expect(result.passed).toBe(true);
  expect(native.selectOption).toHaveBeenCalledWith({ label: 'Chile' }, { timeout: 5000 });
  expect(page.clicks).toEqual([]);
});

test('runJourney selects a dropdown option by exact visible text', async () => {
  const page = createPage();
  openWith(page);
  const filters = [];
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    locator.filter.mockImplementation((filter) => {
      filters.push(filter);
      return locator;
    });
    return locator;
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ select: { blockId: 'country', value: 'Chile' } }],
  });

  expect(result.passed).toBe(true);
  expect(page.clicks).toEqual(['#bl-country', '.ant-select-item-option, [role="option"]']);
  expect(filters[0].hasText.test('Chile')).toBe(true);
  expect(filters[0].hasText.test('Chile (CL)')).toBe(false);
  expect(filters[1]).toEqual({ visible: true });
});

test('runJourney reports a dropdown option that never appears by its text', async () => {
  const page = createPage();
  openWith(page);
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    if (selector.startsWith('.ant-select-item-option')) {
      locator.click.mockRejectedValue(new Error('locator.click: Timeout 5000ms exceeded.'));
    }
    return locator;
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ select: { blockId: 'country', value: 'Chi' } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.expected).toEqual('option "Chi" in the dropdown of block "country"');
  expect(result.failure.actual).toEqual('locator.click: Timeout 5000ms exceeded.');
  expect(result.failure.message).toEqual(
    'No option with text "Chi" appeared in the dropdown of block "country".'
  );
});

test('runJourney fails expect.text with the actual text when it does not contain the string', async () => {
  const page = createPage();
  page.texts['#bl-title'] = 'Hello world';
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { text: { blockId: 'title', contains: 'Hello' } } },
      { expect: { text: { blockId: 'title', contains: 'Goodbye' } } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed']);
  expect(result.failure.expected).toEqual('block "title" text to contain "Goodbye"');
  expect(result.failure.actual).toEqual('Hello world');
});

test('runJourney checks expect.url against the page url', async () => {
  const page = createPage({ url: 'http://localhost:3227/detail?id=1' });
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { url: { contains: '/detail' } } },
      { expect: { url: { contains: 'list' } } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed']);
  expect(result.failure.actual).toEqual('http://localhost:3227/detail?id=1');
});

test('runJourney waits for a request to finish loading and for a state path to be defined', async () => {
  const window = createLowdefyWindow({
    state: {},
    requests: { get_rows: [{ loading: true }] },
  });
  const page = createPage({ window });
  openWith(page);
  page.waitForTimeout.mockImplementation(async () => {
    window.lowdefy.contexts['page:form'].requests.get_rows[0] = { loading: false, response: [] };
    window.lowdefy.contexts['page:form'].state.rows = [];
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ wait: { request: 'get_rows' } }, { wait: { state: 'rows' } }, { wait: { ms: 10 } }],
  });

  expect(result.passed).toBe(true);
  expect(page.waitForTimeout).toHaveBeenCalledWith(10);
});

test('runJourney fails a wait that never settles with the last value seen', async () => {
  const page = createPage({
    window: createLowdefyWindow({ requests: { get_rows: [{ loading: true }] } }),
  });
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ wait: { request: 'get_rows' } }],
    stepTimeout: 20,
  });

  expect(result.passed).toBe(false);
  expect(result.failure.expected).toEqual('request "get_rows" to have finished loading');
  expect(result.failure.actual).toEqual({ loading: true });
  expect(result.failure.message).toMatch(/Timed out after 20ms/);
});

test('runJourney settles the page after an interaction before the next step', async () => {
  const page = createPage();
  openWith(page);

  await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'open' }, { expect: { visible: 'modal' } }],
  });

  // openPage owns the readiness wait; the runner waits once after the click.
  expect(page.waitForFunction).toHaveBeenCalledTimes(1);
  expect(page.waitForFunction.mock.calls[0][1]).toEqual('form');
});

test('runJourney reports an unsettled page open with ready: false and a note', async () => {
  const page = createPage();
  openWith(page, { ready: false });

  const result = await runJourney({ origin, pageId: 'form', steps: [] });

  expect(result.passed).toBe(true);
  expect(result.ready).toBe(false);
  expect(result.note).toMatch(/15000ms/);
});

test('runJourney returns an error and closes the context when the page fails to open', async () => {
  mockOpenPage.mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'));

  const result = await runJourney({ origin, pageId: 'form', steps: [{ click: 'x' }] });

  expect(result.error).toEqual(
    'Failed to run journey at "http://localhost:3227/form": net::ERR_CONNECTION_REFUSED'
  );
});
