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

import setupLink from './setupLink.js';

// Minimal fake window: jsdom does not implement navigation, and the assertions
// here are about which target string the link is handed.
function createFakeLowdefy({ popupBlocked = false } = {}) {
  const calls = { assign: [], open: [], push: [], focus: 0 };
  const handle = {
    focus: () => {
      calls.focus += 1;
    },
  };
  const window = {
    location: {
      origin: 'http://localhost',
      assign: (target) => calls.assign.push(target),
    },
    open: (target, target2) => {
      calls.open.push([target, target2]);
      return popupBlocked ? null : handle;
    },
  };
  return {
    basePath: '',
    inputs: {},
    home: { pageId: 'home', configured: false },
    _internal: {
      globals: { window },
      router: {
        back: jest.fn(),
        push: (args) => calls.push.push(args),
      },
      displayMessage: jest.fn(),
      translate: (key) => key,
    },
    calls,
  };
}

test('an href is navigated to verbatim', () => {
  const lowdefy = createFakeLowdefy();
  const link = setupLink(lowdefy);

  link({ href: '/reports?report_id=1' });

  expect(lowdefy.calls.assign).toEqual(['/reports?report_id=1']);
});

test('an href is passed through as written, where a url is resolved', () => {
  // `href` is an HTML-attribute passthrough: it never enters the navigation
  // grammar, so it reaches window.location.assign exactly as written. The same
  // string as a `url` is classified — a leading slash makes it an app page, so
  // it routes rather than navigating away.
  const withHref = createFakeLowdefy();
  setupLink(withHref)({ href: '/reports' });
  expect(withHref.calls.assign).toEqual(['/reports']);

  const withUrl = createFakeLowdefy();
  setupLink(withUrl)({ url: '/reports' });
  expect(withUrl.calls.assign).toEqual([]);
  expect(withUrl.calls.push).toEqual([{ pathname: '/reports', query: '' }]);
});

test('an href opens in a new tab', () => {
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ href: 'mailto:someone@example.com', newTab: true });

  expect(lowdefy.calls.open).toEqual([['mailto:someone@example.com', '_blank']]);
  expect(lowdefy.calls.focus).toBe(1);
});

test('urlQuery is not appended to an href', () => {
  // An href carries its own query string. Appending would produce two.
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ href: '/reports?a=1', urlQuery: { b: 2 } });

  expect(lowdefy.calls.assign).toEqual(['/reports?a=1']);
});

test('urlQuery is appended to a url', () => {
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ url: 'https://lowdefy.com', urlQuery: { a: 1 } });

  expect(lowdefy.calls.assign).toEqual(['https://lowdefy.com/?a=1']);
});

test('a blocked popup reports itself instead of throwing', () => {
  const lowdefy = createFakeLowdefy({ popupBlocked: true });

  setupLink(lowdefy)({ href: 'https://lowdefy.com', newTab: true });

  expect(lowdefy._internal.displayMessage).toHaveBeenCalledWith({
    content: 'client.popupBlocked',
    status: 'info',
    duration: 10,
  });
  expect(lowdefy.calls.focus).toBe(0);
});

test('a blocked popup on a same-origin new tab reports itself instead of throwing', () => {
  const lowdefy = createFakeLowdefy({ popupBlocked: true });

  expect(() => setupLink(lowdefy)({ pageId: 'reports', newTab: true })).not.toThrow();

  expect(lowdefy.calls.open).toEqual([['http://localhost/reports', '_blank']]);
  expect(lowdefy._internal.displayMessage).toHaveBeenCalledWith({
    content: 'client.popupBlocked',
    status: 'info',
    duration: 10,
  });
  expect(lowdefy.calls.focus).toBe(0);
});

test('a link that resolves to no target throws a ConfigError', () => {
  const lowdefy = createFakeLowdefy();
  lowdefy.home = { pageId: undefined, configured: false };

  expect(() => setupLink(lowdefy)({})).toThrow('Invalid Link: no target resolved.');
});
