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

import { vi, expect, test } from 'vitest';

import setupLink from './setupLink.js';
import createViewLowdefy from './test/createViewLowdefy.js';

// Minimal fake window: jsdom does not implement navigation, and the assertions
// here are about which target string the link is handed.
function createFakeLowdefy({ popupBlocked = false } = {}) {
  const calls = { assign: [], open: [], push: [], replace: [], focus: 0 };
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
    linkPaths: {},
    pagePaths: {},
    pathMemory: new Map(),
    _internal: {
      globals: { window },
      router: {
        back: vi.fn(),
        push: (args) => calls.push.push(args),
        replace: (args) => calls.replace.push(args),
      },
      displayMessage: vi.fn(),
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

test('scroll is forwarded to the router', () => {
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ pageId: 'reports', scroll: false });

  expect(lowdefy.calls.push).toEqual([{ pathname: '/reports', query: '', scroll: false }]);
  expect(lowdefy.calls.replace).toEqual([]);
});

test('replace uses router.replace instead of router.push', () => {
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ pageId: 'reports', urlQuery: { a: 1 }, replace: true, scroll: false });

  expect(lowdefy.calls.push).toEqual([]);
  expect(lowdefy.calls.replace).toEqual([{ pathname: '/reports', query: 'a=1', scroll: false }]);
});

test('newTab wins over replace and scroll', () => {
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ pageId: 'reports', newTab: true, replace: true, scroll: false });

  expect(lowdefy.calls.open).toEqual([['http://localhost/reports', '_blank']]);
  expect(lowdefy.calls.push).toEqual([]);
  expect(lowdefy.calls.replace).toEqual([]);
});

test('a pageId link to a patterned page remembers it before the push and seeds its instance input', () => {
  const lowdefy = createFakeLowdefy();
  lowdefy.pagePaths = { ticket: 'tickets/{space}/{ticket_id}' };
  const memoryAtPush = [];
  lowdefy._internal.router.push = (args) => {
    memoryAtPush.push([...lowdefy.pathMemory.keys()]);
    lowdefy.calls.push.push(args);
  };

  setupLink(lowdefy)({
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: 1234 },
    input: { from: 'list' },
  });

  expect(lowdefy.calls.push).toEqual([
    { pathname: '/tickets/support/1234', query: '', scroll: undefined },
  ]);
  expect(memoryAtPush).toEqual([['tickets/support/1234']]);
  expect(lowdefy.pathMemory.size).toBe(1);
  expect(lowdefy.pathMemory.get('tickets/support/1234')).toEqual({
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: '1234' },
    instanceKey: 'page:ticket#tickets/support/1234',
  });
  expect(lowdefy.inputs['page:ticket#tickets/support/1234']).toEqual({ from: 'list' });
});

test('a newTab pageId link writes no path memory', () => {
  const lowdefy = createFakeLowdefy();
  lowdefy.pagePaths = { ticket: 'tickets/{space}/{ticket_id}' };

  setupLink(lowdefy)({ pageId: 'ticket', pathParams: { space: 's', ticket_id: 1 }, newTab: true });

  expect(lowdefy.calls.open).toEqual([['http://localhost/tickets/s/1', '_blank']]);
  expect(lowdefy.pathMemory.size).toBe(0);
});

test('a url link writes no path memory', () => {
  const lowdefy = createFakeLowdefy();

  setupLink(lowdefy)({ url: '/tickets/s/1' });

  expect(lowdefy.calls.push).toEqual([{ pathname: '/tickets/s/1', query: '', scroll: undefined }]);
  expect(lowdefy.pathMemory.size).toBe(0);
});

test('an href with another scheme throws and does not navigate', () => {
  const lowdefy = createFakeLowdefy();
  const link = setupLink(lowdefy);

  expect(() => link({ href: 'javascript:alert(1)' })).toThrow('Invalid Link: no target resolved.');
  expect(() => link({ href: 'java\tscript:alert(1)', newTab: true })).toThrow(
    'Invalid Link: no target resolved.'
  );
  expect(() => link({ href: 'data:text/html,x', pageId: 'reports' })).toThrow(
    'Invalid Link: no target resolved.'
  );
  expect(lowdefy.calls.assign).toEqual([]);
  expect(lowdefy.calls.open).toEqual([]);
  expect(lowdefy.calls.push).toEqual([]);
});

test('in a view, a pageId link navigates the view router in place and opens nothing', () => {
  const { lowdefy, openLink, router } = createViewLowdefy();
  const seen = [];
  router.subscribe((location) => seen.push(location));

  setupLink(lowdefy)({ pageId: 'tickets', urlQuery: { tab: 'files' } });

  expect(seen).toEqual([{ path: 'tickets', pathname: '/base/tickets', search: '?tab=files' }]);
  expect(lowdefy._internal.globals.window.location.href).toBe(
    'https://app.example.com/base/tickets?tab=files'
  );
  expect(openLink).not.toHaveBeenCalled();
});

test('in a view, a link to a patterned page writes the path memory before the router moves', () => {
  const { lowdefy, router } = createViewLowdefy();
  lowdefy.pagePaths = { ticket: 'tickets/{ticket_id}' };
  const memoryAtMove = [];
  router.subscribe(() => memoryAtMove.push([...lowdefy.pathMemory.keys()]));

  setupLink(lowdefy)({ pageId: 'ticket', pathParams: { ticket_id: 13 }, input: { from: 'list' } });

  expect(memoryAtMove).toEqual([['tickets/13']]);
  expect(router.getLocation().pathname).toBe('/base/tickets/13');
  expect(lowdefy.inputs['page:ticket#tickets/13']).toEqual({ from: 'list' });
});

test('in a view, back returns to the earlier page, and does nothing with no earlier entry', () => {
  const { lowdefy, router } = createViewLowdefy();
  const link = setupLink(lowdefy);

  expect(() => link({ back: true })).not.toThrow();
  expect(router.getLocation().pathname).toBe('/base/tickets/12');

  link({ pageId: 'runs' });
  expect(router.getLocation().pathname).toBe('/base/runs');
  link({ back: true });
  expect(router.getLocation()).toEqual({
    path: 'tickets/12',
    pathname: '/base/tickets/12',
    search: '?tab=notes',
  });
});

test('in a view, a newTab page link opens the page on the app origin with basePath through the host', () => {
  const { lowdefy, openLink, router } = createViewLowdefy();

  setupLink(lowdefy)({ pageId: 'runs', urlQuery: { state: 'open' }, newTab: true });

  expect(openLink.mock.calls).toEqual([[{ url: 'https://app.example.com/base/runs?state=open' }]]);
  expect(router.getLocation().pathname).toBe('/base/tickets/12');
  expect(lowdefy._internal.displayMessage).not.toHaveBeenCalled();
});

test('in a view, a link to another origin opens through the host, in a new tab or not', () => {
  const { lowdefy, openLink } = createViewLowdefy();
  const link = setupLink(lowdefy);

  link({ url: 'https://other.example.org/docs', urlQuery: { a: 1 } });
  link({ url: 'other.example.org', newTab: true });
  link({ href: '/files/report.pdf' });

  expect(openLink.mock.calls).toEqual([
    [{ url: 'https://other.example.org/docs?a=1' }],
    [{ url: 'https://other.example.org/' }],
    [{ url: 'https://app.example.com/files/report.pdf' }],
  ]);
});

test('in a view, an unsafe href is not passed to the host', () => {
  const { lowdefy, openLink } = createViewLowdefy();
  const link = setupLink(lowdefy);

  expect(() => link({ href: 'javascript:alert(1)' })).toThrow('Invalid Link: no target resolved.');
  expect(() => link({ href: 'data:text/html,x', newTab: true })).toThrow(
    'Invalid Link: no target resolved.'
  );
  expect(() => link({ href: 'file:///etc/passwd', newTab: true })).toThrow(
    'Invalid Link: no target resolved.'
  );
  expect(openLink).not.toHaveBeenCalled();
});

test('in a view, a safe href the host cannot open reports itself and reaches no host', () => {
  const { lowdefy, openLink } = createViewLowdefy();

  setupLink(lowdefy)({ href: 'mailto:someone@example.com', newTab: true });

  expect(openLink).not.toHaveBeenCalled();
  expect(lowdefy._internal.displayMessage).toHaveBeenCalledWith({
    content: 'client.popupBlocked',
    status: 'info',
    duration: 10,
  });
});
