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
// against `document`/`window` globals so the real in-page capture is exercised.
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

const mockReadPageArtifact = jest.fn();
jest.unstable_mockModule('./readPageArtifact.js', () => ({ default: mockReadPageArtifact }));

const mockRunSteps = jest.fn();
jest.unstable_mockModule('./runJourney.js', () => ({ runSteps: mockRunSteps }));

const { default: snapshotPage } = await import('./snapshotPage.js');

const PNG = Buffer.from('fake-png');

function createPage({ pageId = 'home', state = { a: 1 }, ready = true, rootHtml } = {}) {
  const root = type(rootHtml) ? { outerHTML: rootHtml } : null;
  // What the capture settle touches: the injected style tag is kept so a test
  // can assert on it, and fonts/rAF resolve immediately.
  const head = { children: [], appendChild: (node) => head.children.push(node) };
  const page = {
    head,
    evaluate: jest.fn(async (fn, id) => {
      globalThis.document = {
        getElementById: (elementId) => (elementId === 'root' ? root : null),
        documentElement: { outerHTML: '<html><body>no root</body></html>' },
        createElement: () => ({ textContent: '' }),
        head,
        fonts: { ready: Promise.resolve() },
      };
      globalThis.window = {
        lowdefy: {
          pageId,
          contexts: { [`page:${pageId}`]: { state, requests: { r: [] }, eventLog: [1] } },
        },
      };
      try {
        return fn(id);
      } finally {
        delete globalThis.document;
        delete globalThis.window;
      }
    }),
    screenshot: jest.fn(async () => PNG),
    waitForTimeout: jest.fn(async () => {}),
  };
  const context = { close: jest.fn(async () => {}) };
  mockOpenPage.mockResolvedValue({ context, page, ready, url: `http://localhost:3001/${pageId}` });
  return { page, context };
}

function type(value) {
  return value !== undefined;
}

// The capture settle resolves after `document.fonts.ready`, so its rAF call
// happens once `evaluate` has already restored the process globals.
beforeEach(() => {
  globalThis.requestAnimationFrame = (callback) => callback();
  mockGetBrowser.mockResolvedValue({ isConnected: () => true });
  mockReadPageArtifact.mockReturnValue({ id: 'home', type: 'Box' });
  mockRunSteps.mockResolvedValue({ results: [], screenshots: [], failure: undefined });
});

afterEach(() => {
  delete globalThis.requestAnimationFrame;
});

test('snapshotPage returns an error when origin is missing', async () => {
  const result = await snapshotPage({ pageId: 'home' });
  expect(result.error).toMatch(/requires an "origin" string/);
});

test('snapshotPage returns an error when pageId is missing', async () => {
  const result = await snapshotPage({ origin: 'http://localhost:3001' });
  expect(result.error).toMatch(/requires a "pageId" string/);
});

test('snapshotPage returns an error when urlQuery is not an object', async () => {
  const result = await snapshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    urlQuery: 'x',
  });
  expect(result.error).toMatch(/requires "urlQuery" to be an object/);
});

test('snapshotPage rejects a malformed journey before opening a browser', async () => {
  const result = await snapshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    journey: [{ bogus: 1 }],
  });
  expect(result.error).toMatch(/^Invalid journey: Step 0/);
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

test('snapshotPage returns an actionable error when no browser is available', async () => {
  mockGetBrowser.mockRejectedValue(new Error("Executable doesn't exist"));
  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.error).toMatch(/No Chromium available. Run: npx playwright install chromium/);
});

test('snapshotPage returns screenshot, dom, state and snapshotIgnore', async () => {
  const { context } = createPage({
    rootHtml: '<div id="root"><div id="bl-title">Hello</div></div>',
    state: { title: 'Hello', created_at: '2026-01-01T00:00:00.000Z' },
  });
  mockReadPageArtifact.mockReturnValue({
    id: 'home',
    type: 'Box',
    '~snapshotIgnore': ['created_at', 'rows.$.score', 42],
  });

  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });

  expect(result).toEqual({
    pageId: 'home',
    screenshot: PNG.toString('base64'),
    dom: '<div id="root"><div id="bl-title">Hello</div></div>',
    state: { title: 'Hello', created_at: '2026-01-01T00:00:00.000Z' },
    snapshotIgnore: ['created_at', 'rows.$.score'],
  });
  expect(mockReadPageArtifact).toHaveBeenCalledWith({ pageId: 'home' });
  expect(context.close).toHaveBeenCalled();
});

test('snapshotPage freezes animations and transitions before it captures', async () => {
  const { page } = createPage({ rootHtml: '<div id="root"></div>' });

  await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });

  expect(page.head.children).toHaveLength(1);
  expect(page.head.children[0].textContent).toBe(
    '*, *::before, *::after { animation: none !important; transition: none !important; }'
  );
  expect(page.waitForTimeout).not.toHaveBeenCalled();
});

test('snapshotPage returns an empty snapshotIgnore when the page declares none', async () => {
  createPage({ rootHtml: '<div id="root"></div>' });
  mockReadPageArtifact.mockReturnValue(null);
  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.snapshotIgnore).toEqual([]);
});

test('snapshotPage opens the page with the deterministic context options', async () => {
  createPage({ rootHtml: '<div id="root"></div>' });

  await snapshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    user: 'admin',
    urlQuery: { slug: 'x' },
    width: 1024,
    height: 700,
    timeout: 2000,
  });

  expect(mockOpenPage).toHaveBeenCalledWith({
    browser: expect.anything(),
    origin: 'http://localhost:3001',
    pageId: 'home',
    user: 'admin',
    urlQuery: { slug: 'x' },
    width: 1024,
    height: 700,
    timeout: 2000,
    contextOptions: {
      reducedMotion: 'reduce',
      colorScheme: 'light',
      locale: 'en-US',
      timezoneId: 'UTC',
    },
  });
});

test('snapshotPage captures state only, not requests or eventLog', async () => {
  createPage({ rootHtml: '<div id="root"></div>', state: { x: 1 } });
  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.state).toEqual({ x: 1 });
  expect(result).not.toHaveProperty('requests');
  expect(result).not.toHaveProperty('eventLog');
});

test('snapshotPage falls back to the document when there is no #root element', async () => {
  createPage();
  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.dom).toBe('<html><body>no root</body></html>');
});

test('snapshotPage runs the journey steps before capturing', async () => {
  const { page } = createPage({ rootHtml: '<div id="root"></div>' });
  const steps = [{ click: 'open' }];

  const result = await snapshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    journey: steps,
  });

  expect(mockRunSteps).toHaveBeenCalledWith({ page, steps, stepTimeout: 5000 });
  expect(result.error).toBeUndefined();
  const [runOrder] = mockRunSteps.mock.invocationCallOrder;
  const [screenshotOrder] = page.screenshot.mock.invocationCallOrder;
  expect(runOrder).toBeLessThan(screenshotOrder);
});

test('snapshotPage does not run the journey runner when no journey is given', async () => {
  createPage({ rootHtml: '<div id="root"></div>' });
  await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(mockRunSteps).not.toHaveBeenCalled();
});

test('snapshotPage returns an error when a journey step fails', async () => {
  const { context } = createPage({ rootHtml: '<div id="root"></div>' });
  mockRunSteps.mockResolvedValue({
    results: [],
    screenshots: [],
    failure: { index: 0, step: { click: 'open' }, message: 'Block "open" was not actionable.' },
  });

  const result = await snapshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    journey: [{ click: 'open' }],
  });

  expect(result.error).toBe(
    'Journey step 0 failed before the snapshot was taken: Block "open" was not actionable.'
  );
  expect(result.failure.index).toBe(0);
  expect(context.close).toHaveBeenCalled();
});

test('snapshotPage flags an unsettled page with ready: false and a note', async () => {
  createPage({ rootHtml: '<div id="root"></div>', ready: false });
  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.ready).toBe(false);
  expect(result.note).toMatch(/did not settle/);
  expect(result.dom).toBe('<div id="root"></div>');
});

test('snapshotPage reports a render failure and closes the context', async () => {
  const { page, context } = createPage({ rootHtml: '<div id="root"></div>' });
  page.screenshot.mockRejectedValue(new Error('Target closed'));
  const result = await snapshotPage({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.error).toBe('Failed to snapshot "http://localhost:3001/home": Target closed');
  expect(context.close).toHaveBeenCalled();
});
