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
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

// openPage takes its browser as a parameter, so a fake one covers the cookie
// injection without a real Chromium. lib/build/config.js reads build/config.json
// from process.cwd() at import time — chdir into a fixture that has one before
// getBrowser.js is loaded. Mirrors the pattern in screenshotPage.test.mjs.
const originalCwd = process.cwd();
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-get-browser-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
fs.writeFileSync(path.join(fixtureDir, 'build', 'config.json'), JSON.stringify({ basePath: '' }));
process.chdir(fixtureDir);

const { openPage } = await import('./getBrowser.js');
const { default: isPageReady } = await import('./isPageReady.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

function createBrowser() {
  const addCookies = jest.fn();
  const page = {
    goto: jest.fn().mockResolvedValue(undefined),
    waitForFunction: jest.fn().mockResolvedValue(undefined),
  };
  const context = {
    addCookies,
    newPage: jest.fn().mockResolvedValue(page),
  };
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

test('openPage injects the default roleless user when no user is given', async () => {
  const { browser, addCookies } = createBrowser();

  await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  expect(decodeUserCookie(addCookies)).toEqual({
    id: 'lowdefy-headless',
    name: 'Lowdefy Headless',
    roles: [],
  });
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

test('openPage waits on the isPageReady predicate for the page it opened', async () => {
  const { browser } = createBrowser();

  const opened = await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  expect(opened.page.waitForFunction).toHaveBeenCalledWith(isPageReady, 'home', { timeout: 15000 });
  expect(opened.ready).toBe(true);
});

test('openPage resolves with ready false when the readiness wait times out', async () => {
  const { browser, page } = createBrowser();
  page.waitForFunction.mockRejectedValue(new Error('Timeout 15000ms exceeded.'));

  const opened = await openPage({ browser, origin: 'http://localhost:3001', pageId: 'home' });

  expect(opened.ready).toBe(false);
  expect(opened.page).toBe(page);
});
