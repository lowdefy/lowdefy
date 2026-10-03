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

import { EventEmitter } from 'node:events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Hono } from 'hono';
import { jest } from '@jest/globals';

const mockLaunch = jest.fn();
jest.unstable_mockModule('playwright-core', () => ({ chromium: { launch: mockLaunch } }));

// openPage takes its browser as a parameter, so a fake one covers the cookie
// injection without a real Chromium. lib/build/config.js reads build/config.json
// from process.cwd() at import time — chdir into a fixture that has one before
// getBrowser.js is loaded. Mirrors the pattern in screenshotPage.test.mjs.
const originalCwd = process.cwd();
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-get-browser-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
fs.writeFileSync(path.join(fixtureDir, 'build', 'config.json'), JSON.stringify({ basePath: '' }));
process.chdir(fixtureDir);

const { getBrowser, openPage, buildPageUrl } = await import('./getBrowser.js');
const { default: isPageReady } = await import('./isPageReady.js');
const { default: getClientAddress } = await import('../server/getClientAddress.js');
const { default: readRecordingCookie } = await import('../server/recording/readRecordingCookie.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

// Every caller closes the contexts openPage gives it; the tests do too, so the
// module's open-context count starts each test at 0.
const openedContexts = [];

afterEach(async () => {
  await Promise.all(openedContexts.splice(0).map((context) => context.close()));
});

function createBrowser() {
  const addCookies = jest.fn();
  const page = {
    goto: jest.fn().mockResolvedValue(undefined),
    waitForFunction: jest.fn().mockResolvedValue(undefined),
  };
  // Like Playwright's, the context emits close once, when it first closes.
  const context = Object.assign(new EventEmitter(), {
    addCookies,
    newPage: jest.fn().mockResolvedValue(page),
  });
  let closed = false;
  context.close = jest.fn(async () => {
    if (closed) return;
    closed = true;
    context.emit('close');
  });
  openedContexts.push(context);
  return {
    browser: { newContext: jest.fn().mockResolvedValue(context) },
    addCookies,
    context,
    page,
  };
}

function decodeUserCookie(addCookies) {
  const [[[cookie]]] = addCookies.mock.calls;
  return JSON.parse(Buffer.from(cookie.value, 'base64').toString());
}

test('openPage opens a 1280x800 light viewport by default', async () => {
  const { browser } = createBrowser();

  await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  expect(browser.newContext).toHaveBeenCalledWith({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  });
});

test('openPage opens the viewport size and colour scheme it is given', async () => {
  const { browser } = createBrowser();

  await openPage({
    browser,
    origin: 'http://localhost:3001',
    pageId: 'home',
    width: 390,
    height: 844,
    colorScheme: 'dark',
  });

  expect(browser.newContext).toHaveBeenCalledWith({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
  });
});

test('openPage injects the default roleless user when no user is given', async () => {
  const { browser, addCookies } = createBrowser();

  await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  expect(decodeUserCookie(addCookies)).toEqual({
    id: 'lowdefy-headless',
    name: 'Lowdefy Headless',
    roles: [],
  });
});

test('openPage injects no user for user none, so the app resolves its own sessions', async () => {
  const { browser, addCookies } = createBrowser();

  const opened = await openPage({
    browser,
    origin: 'http://localhost:3001',
    pageId: 'login',
    user: 'none',
  });

  const names = addCookies.mock.calls.map(([[cookie]]) => cookie.name);
  expect(names).toEqual(['lowdefy_recording']);
  expect(opened.ready).toBe(true);
});

function findCookie(addCookies, name) {
  return addCookies.mock.calls.map(([[cookie]]) => cookie).find((cookie) => cookie.name === name);
}

test('openPage marks a context with no recording as off, so screenshots and inspection never record', async () => {
  const { browser, addCookies } = createBrowser();

  await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  const cookie = findCookie(addCookies, 'lowdefy_recording');
  expect(cookie).toMatchObject({ url: 'http://localhost:3001', httpOnly: true, sameSite: 'Lax' });
  expect(readRecordingCookie(`lowdefy_recording=${cookie.value}`)).toBe('off');
});

test('openPage marks a recording context with a cookie readRecordingCookie verifies', async () => {
  const { browser, addCookies, page } = createBrowser();
  const recording = {
    source: 'journey',
    run: {
      id: '20261003T151200Z-p0d4rm',
      by: 'test',
      journey: 'tests/journeys/tickets.yaml#Assign a ticket',
      actor: 'main',
    },
  };

  await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home', recording });

  const cookie = findCookie(addCookies, 'lowdefy_recording');
  expect(readRecordingCookie(`lowdefy_recording=${cookie.value}`)).toEqual(recording);
  const recordingCall = addCookies.mock.invocationCallOrder[addCookies.mock.calls.length - 1];
  expect(recordingCall).toBeLessThan(page.goto.mock.invocationCallOrder[0]);
});

test('openPage gives the context the client address it is given, which the dev server resolves', async () => {
  const { browser, addCookies } = createBrowser();

  await openPage({
    browser,
    origin: 'http://localhost:3001',
    pageId: 'login',
    user: 'none',
    clientAddress: '203.0.113.7',
  });

  expect(browser.newContext).toHaveBeenCalledWith({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  });
  const [[[cookie]]] = addCookies.mock.calls;
  expect(cookie).toMatchObject({
    name: 'lowdefy_journey_actor',
    url: 'http://localhost:3001',
    httpOnly: true,
    sameSite: 'Lax',
  });
  const app = new Hono();
  app.get('/', (c) => c.text(getClientAddress(c)));
  const env = { incoming: { socket: { remoteAddress: '127.0.0.1' } } };
  const response = await app.request(
    '/',
    { headers: { cookie: `${cookie.name}=${cookie.value}` } },
    env
  );
  expect(await response.text()).toBe('203.0.113.7');
});

test('openPage injects a per-call user with roles', async () => {
  const { browser, addCookies } = createBrowser();

  await openPage({
    browser,
    origin: 'http://localhost:3001',
    pageId: 'home',
    user: { id: 'agent', roles: ['user-admin'] },
  });

  expect(decodeUserCookie(addCookies)).toEqual({
    id: 'agent',
    name: 'Lowdefy Headless',
    roles: ['user-admin'],
  });
});

test('openPage gives concurrent calls their own identity', async () => {
  const admin = createBrowser();
  const member = createBrowser();

  await Promise.all([
    openPage({
      browser: admin.browser,
      origin: 'http://localhost:3001',
      pageId: 'home',
      user: { roles: ['user-admin'] },
    }),
    openPage({
      browser: member.browser,
      origin: 'http://localhost:3001',
      pageId: 'home',
      user: { roles: ['member'] },
    }),
  ]);

  expect(decodeUserCookie(admin.addCookies).roles).toEqual(['user-admin']);
  expect(decodeUserCookie(member.addCookies).roles).toEqual(['member']);
});

test('openPage rejects an invalid user before opening a browser context', async () => {
  const { browser } = createBrowser();

  await expect(
    openPage({ browser, origin: 'http://localhost:3001', pageId: 'home', user: 'admin' })
  ).rejects.toThrow('Headless "user" must be an object. Received "admin".');
  expect(browser.newContext).not.toHaveBeenCalled();
});

test('openPage loads the page and waits on isPageReady for the page the app shows', async () => {
  const { browser } = createBrowser();

  const opened = await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  // Not networkidle: the dev reload event stream keeps the network busy for the
  // life of the page, so that wait only ever ran out its timeout.
  expect(opened.page.goto).toHaveBeenCalledTimes(1);
  expect(opened.page.goto).toHaveBeenCalledWith('http://localhost:3001/home', {
    waitUntil: 'load',
    timeout: 15000,
  });
  // null: the page shown, so a redirect to the sign-in page settles too.
  expect(opened.page.waitForFunction).toHaveBeenCalledWith(isPageReady, null, { timeout: 15000 });
  expect(opened.ready).toBe(true);
});

test.each([
  ['every image has loaded', [{ complete: true }], true],
  ['an image is still loading', [{ complete: true }, { complete: false, loading: 'eager' }], false],
  // Below the fold a lazy image never loads, so waiting on it would always
  // run out the timeout.
  [
    'the only one loading is lazy',
    [{ complete: true }, { complete: false, loading: 'lazy' }],
    true,
  ],
])('openPage treats the page images as loaded when %s', async (_, images, loaded) => {
  const { browser, page } = createBrowser();

  await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  const imagesLoaded = page.waitForFunction.mock.calls[1][0];
  global.document = { images };
  try {
    expect(imagesLoaded()).toBe(loaded);
  } finally {
    delete global.document;
  }
});

test('openPage resolves with ready false when the readiness wait times out', async () => {
  const { browser, page } = createBrowser();
  page.waitForFunction.mockRejectedValueOnce(new Error('Timeout 15000ms exceeded.'));

  const opened = await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  expect(opened.ready).toBe(false);
  expect(opened.page).toBe(page);
});

test('openPage closes the context it created when the navigation fails', async () => {
  const { browser, context, page } = createBrowser();
  page.goto.mockRejectedValue(new Error('Timeout 15000ms exceeded.'));

  await expect(
    openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' })
  ).rejects.toThrow('Timeout 15000ms exceeded.');
  expect(context.close).toHaveBeenCalledTimes(1);
});

test('openPage closes the context it created when opening a page fails', async () => {
  const { browser, context } = createBrowser();
  context.newPage.mockRejectedValue(new Error('Browser crashed.'));

  await expect(
    openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' })
  ).rejects.toThrow('Browser crashed.');
  expect(context.close).toHaveBeenCalledTimes(1);
});

test('buildPageUrl returns the bare page route without a urlQuery', () => {
  expect(buildPageUrl({ origin: 'http://localhost:3001', pageId: 'home' })).toEqual(
    'http://localhost:3001/home'
  );
  expect(buildPageUrl({ origin: 'http://localhost:3001', pageId: 'home', urlQuery: {} })).toEqual(
    'http://localhost:3001/home'
  );
});

test('buildPageUrl appends urlQuery the way the engine serializes Link urlQuery', () => {
  expect(
    buildPageUrl({
      origin: 'http://localhost:3001',
      pageId: 'detail',
      urlQuery: { id: 'abc 1', page: 2, filter: { open: true } },
    })
  ).toEqual('http://localhost:3001/detail?id=abc+1&page=2&filter=%7B%22open%22%3Atrue%7D');
});

test('openPage opens the page at the urlQuery it was given', async () => {
  const { browser, page } = createBrowser();

  const opened = await openPage({
    browser,
    origin: 'http://localhost:3001',
    pageId: 'detail',
    urlQuery: { id: '1' },
  });

  expect(opened.url).toEqual('http://localhost:3001/detail?id=1');
  expect(page.goto.mock.calls[0][0]).toEqual('http://localhost:3001/detail?id=1');
});

test('a failed openPage closes its context, so the idle browser still closes', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  try {
    const { browser, page } = createBrowser();
    browser.isConnected = () => true;
    browser.close = jest.fn(async () => {});
    mockLaunch.mockResolvedValue(browser);
    page.goto.mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'));

    const launched = await getBrowser();
    await expect(
      openPage({ browser: launched, origin: 'http://localhost:3001', pageId: 'home' })
    ).rejects.toThrow('net::ERR_CONNECTION_REFUSED');
    jest.advanceTimersByTime(90_000);
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }

    expect(browser.close).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});
