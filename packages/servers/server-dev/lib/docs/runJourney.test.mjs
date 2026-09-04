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
  deterministicContextOptions: {
    reducedMotion: 'reduce',
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
}));

const mockSeedFixture = jest.fn();
jest.unstable_mockModule('./seedFixture.js', () => ({ default: mockSeedFixture }));

const { default: runJourney } = await import('./runJourney.js');

// Node ships a read-only navigator; the page's platform decides Mod, so it is
// replaced with a Mac one for the Mod+k test.
Object.defineProperty(globalThis, 'navigator', {
  value: { platform: 'MacIntel' },
  configurable: true,
});

// `blocks` stands in for the engine's RootSlots.map: an input block carries
// setValue exactly as Block._initInput builds it, a display block does not.
function createInputBlock({ blockId, state, type: blockType = 'TextInput' }) {
  return {
    blockId,
    type: blockType,
    setValue: (value) => {
      state[blockId] = value;
    },
  };
}

function createLowdefyWindow({ pageId = 'form', state = {}, requests = {}, blocks = {} } = {}) {
  return {
    lowdefy: {
      pageId,
      contexts: {
        [`page:${pageId}`]: {
          state,
          requests,
          websockets: {},
          _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: blocks } },
        },
      },
    },
  };
}

// The block locator contract getBlock builds: the block root's own test id, with
// the layout wrapper as the fallback for a root that does not carry it. The fake
// page keys everything on the selector string, so the tests build it the same way.
function blockSelector(blockId) {
  const testId = `[data-testid="${blockId}"]`;
  return `${testId}, #bl-${blockId.replace(/([^\w-])/g, '\\$1')}:not(:has(${testId}))`;
}

function createLocator({ selector, page }) {
  const locator = {
    selector,
    click: jest.fn(async () => {
      if (page.missingBlocks.some((id) => selector === blockSelector(id))) {
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
    last: jest.fn(() => locator),
    filter: jest.fn(() => locator),
    // A block is assumed to hold a typeable surface unless the test says
    // otherwise, which is what `fill` checks before falling back to `set`.
    count: jest.fn(
      async () => page.locatorCounts[selector] ?? (selector.endsWith(' input, textarea') ? 1 : 0)
    ),
    selectOption: jest.fn(),
    getAttribute: jest.fn(async (name) => page.attributes[`${selector}@${name}`] ?? null),
    press: jest.fn(async (key) => page.presses.push({ selector, key })),
    waitFor: jest.fn(async () => {
      if (page.hiddenBlocks.some((id) => selector === blockSelector(id))) {
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
    attributes: {},
    locatorCounts: {},
    screenshotCount: 0,
    evaluate: jest.fn(async (fn, arg) => fn(arg)),
    waitForFunction: jest.fn(async (fn, arg) => {
      if (!fn(arg)) {
        throw new Error('waitForFunction: Timeout exceeded.');
      }
    }),
    waitForTimeout: jest.fn(async () => {}),
    waitForURL: jest.fn(async (predicate) => {
      if (!predicate(new URL(page.currentUrl))) {
        throw new Error('page.waitForURL: Timeout exceeded.');
      }
    }),
    currentUrl: url,
    url: jest.fn(() => page.currentUrl),
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
  mockSeedFixture.mockResolvedValue({ refused: false, seeded: [] });
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
  expect(result.error).toMatch(/"steps" should be an array of steps/);
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

test('runJourney returns an error naming an unknown step key before opening a browser', async () => {
  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'ok' }, { tap: 'ok' }],
  });
  expect(result.error).toEqual(
    'Step 1 has unknown key "tap". Steps are: click, fill, set, select, press, wait, screenshot, expect.'
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
    contextOptions: {
      reducedMotion: 'reduce',
      colorScheme: 'light',
      locale: 'en-US',
      timezoneId: 'UTC',
    },
  });
});

test('runJourney fills, clicks and asserts state, returning passed with the final state', async () => {
  const window = createLowdefyWindow({ state: { name: '', saved: false } });
  const page = createPage({ window });
  const context = openWith(page);
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    if (selector === blockSelector('submit')) {
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
  expect(page.fills).toEqual([
    { selector: `${blockSelector('name')} input, textarea`, value: 'Ada' },
  ]);
  expect(page.clicks).toEqual([blockSelector('submit')]);
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
      if (selector === blockSelector('submit') && child.startsWith('button')) {
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
    `${blockSelector(
      'submit'
    )} button, [role="button"], a[href], input:not([type="hidden"]), textarea, select, [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"]`,
    blockSelector('card'),
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
  expect(page.fills).toEqual([
    { selector: `${blockSelector('age')} input, textarea`, value: '42' },
  ]);
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
    `locator.click: Timeout 5000ms exceeded.\nCall log:\n  - waiting for locator('${blockSelector(
      'nope'
    )}')`
  );
  expect(result.failure.message).toMatch(/Block "nope" was not actionable/);
  expect(result.steps.map((step) => step.status)).toEqual(['failed', 'skipped']);
  expect(context.close).toHaveBeenCalledTimes(1);
});

test('runJourney escapes block ids in both halves of the block locator', async () => {
  const page = createPage();
  openWith(page);
  await runJourney({ origin, pageId: 'form', steps: [{ click: 'rows.0.edit' }] });
  expect(page.clicks).toEqual([
    '[data-testid="rows.0.edit"], #bl-rows\\.0\\.edit:not(:has([data-testid="rows.0.edit"]))',
  ]);
});

test('runJourney collects screenshots in step order with default and given names', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ screenshot: 'start' }, { click: 'open' }, { screenshot: null }],
  });

  expect(result.passed).toBe(true);
  expect(result.screenshots).toEqual([
    { name: 'start', data: Buffer.from('png-1').toString('base64'), mimeType: 'image/png' },
    { name: 'step-2', data: Buffer.from('png-2').toString('base64'), mimeType: 'image/png' },
  ]);
});

test('runJourney refuses the undocumented screenshot: true alias', async () => {
  const result = await runJourney({ origin, pageId: 'form', steps: [{ screenshot: true }] });
  expect(result.error).toEqual('Step 0 "screenshot" takes an optional name string. Received true.');
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

test('runJourney presses on the block control when press names a blockId', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ press: { blockId: 'title', key: 'Mod+Enter' } }],
  });

  expect(result.passed).toBe(true);
  expect(page.presses).toEqual([{ selector: blockSelector('title'), key: 'Meta+Enter' }]);
  expect(page.keyboard.press).not.toHaveBeenCalled();
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
  expect(page.clicks).toEqual([
    blockSelector('country'),
    '.ant-select-item-option, [role="option"]',
  ]);
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
  page.texts[blockSelector('title')] = 'Hello world';
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

test('runJourney checks expect.text equals against the trimmed text', async () => {
  const page = createPage();
  page.texts[blockSelector('title')] = '  Hello world\n';
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { text: { blockId: 'title', equals: 'Hello world' } } },
      { expect: { text: { blockId: 'title', equals: 'Hello' } } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed']);
  expect(result.failure.expected).toEqual('block "title" text to equal "Hello"');
  expect(result.failure.message).toEqual(
    'Expected block "title" text to equal "Hello" but found "  Hello world\\n".'
  );
});

test('runJourney checks expect.text notContains, which is what proves a row was removed', async () => {
  const page = createPage();
  page.texts[blockSelector('rows')] = 'Access reviews';
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { text: { blockId: 'rows', notContains: 'Vendor reviews' } } },
      { expect: { text: { blockId: 'rows', notContains: 'Access' } } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed']);
  expect(result.failure.expected).toEqual('block "rows" text not to contain "Access"');
  expect(result.failure.actual).toEqual('Access reviews');
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

test('runJourney set writes through the block setValue of an input block', async () => {
  const state = { rating: 1 };
  const window = createLowdefyWindow({
    state,
    blocks: { rating: createInputBlock({ blockId: 'rating', state, type: 'Rating' }) },
  });
  const page = createPage({ window });
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { set: { blockId: 'rating', value: 4 } },
      { expect: { state: { path: 'rating', equals: 4 } } },
    ],
  });

  expect(result.passed).toBe(true);
  expect(result.state).toEqual({ rating: 4 });
  expect(page.fills).toEqual([]);
});

test('runJourney set reports a block that is not an input by its type', async () => {
  const window = createLowdefyWindow({
    blocks: { title: { blockId: 'title', type: 'Title' } },
  });
  const page = createPage({ window });
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ set: { blockId: 'title', value: 'x' } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.expected).toEqual('block "title" to be an input block');
  expect(result.failure.actual).toEqual('Title');
  expect(result.failure.message).toEqual(
    'Block "title" has type "Title", which is not an input block, so "set" has no value to write. Use "click" for a block that is not an input.'
  );
});

test('runJourney set reports a block that is not on the page', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ set: { blockId: 'missing', value: 'x' } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.message).toEqual('Block "missing" is not on page "form".');
  expect(result.failure.actual).toBeNull();
});

test('runJourney fill falls back to set semantics when the block has no input or textarea', async () => {
  const state = {};
  const window = createLowdefyWindow({
    state,
    blocks: { body: createInputBlock({ blockId: 'body', state, type: 'TipTap' }) },
  });
  const page = createPage({ window });
  page.locatorCounts[`${blockSelector('body')} input, textarea`] = 0;
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ fill: { blockId: 'body', value: 'Hello' } }],
  });

  expect(result.passed).toBe(true);
  expect(page.fills).toEqual([]);
  expect(result.state).toEqual({ body: 'Hello' });
});

test('runJourney fill reports a block that can neither be typed into nor set', async () => {
  const window = createLowdefyWindow({ blocks: { card: { blockId: 'card', type: 'Card' } } });
  const page = createPage({ window });
  page.locatorCounts[`${blockSelector('card')} input, textarea`] = 0;
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ fill: { blockId: 'card', value: 'Hello' } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.message).toMatch(
    /Block "card" has type "Card", which is not an input block, so "fill" has no value to write/
  );
});

test('runJourney scopes select options to the dropdown that was just opened', async () => {
  const page = createPage();
  page.locatorCounts['.ant-select-dropdown:not(.ant-select-dropdown-hidden)'] = 2;
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ select: { blockId: 'country', value: 'Chile' } }],
  });

  expect(result.passed).toBe(true);
  expect(page.clicks).toEqual([
    blockSelector('country'),
    '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option, [role="option"]',
  ]);
});

test('runJourney asserts a class the block holds and one it does not', async () => {
  const page = createPage();
  page.attributes[`${blockSelector('submit')}@class`] = 'ant-btn ant-btn-primary';
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { dom: { blockId: 'submit', hasClass: 'ant-btn-primary' } } },
      { expect: { dom: { blockId: 'submit', notHasClass: 'ant-btn-disabled' } } },
      { expect: { dom: { blockId: 'submit', notHasClass: 'ant-btn' } } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'ok', 'failed']);
  expect(result.failure.expected).toEqual('block "submit" not to have class "ant-btn"');
  expect(result.failure.actual).toEqual('ant-btn ant-btn-primary');
});

test('runJourney reads expect.dom.hasClass off the block root, not the layout wrapper', async () => {
  const page = createPage();
  // Only the wrapper carries the class. The block's own `class:` lives on its root,
  // which is what the assertion must read.
  page.attributes['#bl-submit@class'] = 'ant-btn ant-btn-primary';
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ expect: { dom: { blockId: 'submit', hasClass: 'ant-btn-primary' } } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.actual).toBeNull();
});

test('runJourney reports a class assertion against a block with no class attribute', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ expect: { dom: { blockId: 'submit', hasClass: 'ant-btn-primary' } } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.message).toEqual(
    'Expected block "submit" to have class "ant-btn-primary" but found null.'
  );
});

test('runJourney asserts an attribute value and a descendant selector', async () => {
  const page = createPage();
  page.attributes[`${blockSelector('total')}@aria-disabled`] = 'true';
  page.locatorCounts[`${blockSelector('total')} span.amount`] = 1;
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { expect: { dom: { blockId: 'total', attribute: 'aria-disabled', equals: 'true' } } },
      { expect: { dom: { blockId: 'total', matches: 'span.amount' } } },
      { expect: { dom: { blockId: 'total', matches: 'span.currency' } } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'ok', 'failed']);
  expect(result.failure.expected).toEqual(
    'block "total" to contain an element matching "span.currency"'
  );
  expect(result.failure.actual).toEqual(0);
});

test('runJourney fails an attribute assertion with the value it found', async () => {
  const page = createPage();
  page.attributes[`${blockSelector('total')}@aria-disabled`] = 'false';
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ expect: { dom: { blockId: 'total', attribute: 'aria-disabled', equals: 'true' } } }],
  });

  expect(result.passed).toBe(false);
  expect(result.failure.actual).toEqual('false');
  expect(result.failure.message).toEqual(
    'Expected block "total" attribute "aria-disabled" to equal "true" but found "false".'
  );
});

test('runJourney asserts the previous step duration with expect.durationMsUnder', async () => {
  const page = createPage();
  openWith(page);

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [
      { wait: { ms: 1 } },
      { expect: { durationMsUnder: 5000 } },
      { wait: { ms: 1 } },
      { expect: { durationMsUnder: 0 } },
    ],
  });

  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'ok', 'ok', 'failed']);
  expect(result.failure.expected).toEqual('step 2 to take less than 0ms');
  expect(result.failure.message).toMatch(
    /Expected step 2 to take less than 0ms but it took \d+ms\./
  );
});

test('runJourney waits for the page id to change before settling after a navigating click', async () => {
  const state = {};
  const window = createLowdefyWindow({ state });
  window.lowdefy.contexts['page:detail'] = {
    state: { id: '1' },
    requests: {},
    websockets: {},
    _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: {} } },
  };
  const page = createPage({ window });
  openWith(page);
  page.locator.mockImplementation((selector) => {
    const locator = createLocator({ selector, page });
    if (selector === blockSelector('row')) {
      locator.click.mockImplementation(async () => {
        page.currentUrl = 'http://localhost:3227/detail?id=1';
        window.lowdefy.pageId = 'detail';
        page.clicks.push(selector);
      });
    }
    return locator;
  });

  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'row' }, { expect: { url: { contains: '/detail' } } }],
  });

  expect(result.passed).toBe(true);
  expect(page.waitForFunction).toHaveBeenCalledTimes(2);
  expect(page.waitForFunction.mock.calls[0][1]).toEqual('form');
  expect(page.waitForFunction.mock.calls[1][1]).toEqual('detail');
  expect(result.state).toEqual({ id: '1' });
});

test('runJourney seeds every named fixture, with reset, before the page is opened', async () => {
  const page = createPage();
  openWith(page);
  const result = await runJourney({
    origin,
    pageId: 'form',
    fixtures: ['base', 'org-a'],
    honoContext: { tag: 'hono' },
    steps: [],
  });
  expect(mockSeedFixture.mock.calls.map(([args]) => args)).toEqual([
    { name: 'base', reset: true, honoContext: { tag: 'hono' } },
    { name: 'org-a', reset: true, honoContext: { tag: 'hono' } },
  ]);
  expect(mockSeedFixture.mock.invocationCallOrder[0]).toBeLessThan(
    mockOpenPage.mock.invocationCallOrder[0]
  );
  expect(result.passed).toBe(true);
});

test('runJourney returns the seeding refusal and never opens a page', async () => {
  mockSeedFixture.mockResolvedValue({
    refused: true,
    reason: 'Seeding writes to the dev database.',
    howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
  });
  const result = await runJourney({ origin, pageId: 'form', fixtures: ['base'], steps: [] });
  expect(result.error).toEqual(
    'Could not seed fixture "base": Seeding writes to the dev database. Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).'
  );
  expect(mockOpenPage).not.toHaveBeenCalled();
});

test('runJourney rejects fixtures that are not a list of names', async () => {
  const result = await runJourney({ origin, pageId: 'form', fixtures: 'base', steps: [] });
  expect(result.error).toEqual(
    'runJourney requires "fixtures" to be an array of fixture names. Received "base".'
  );
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

// Only `lowdefy test --update` may fill an expectation, so the dev server
// refuses one that asserts nothing rather than reporting a step that passed.
test('runJourney refuses an expect.state with no equals before opening a browser', async () => {
  const result = await runJourney({
    origin,
    pageId: 'form',
    steps: [{ click: 'submit' }, { expect: { state: { path: 'title' } } }],
  });
  expect(result.error).toEqual(
    'Incomplete expectation at step 1: "expect.state" for path "title" has no "equals". Run lowdefy test --update to fill it from the observed state.'
  );
  expect(mockGetBrowser).not.toHaveBeenCalled();
});
