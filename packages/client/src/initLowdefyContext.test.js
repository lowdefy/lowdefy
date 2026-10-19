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

import { getHtmlEnhancements } from '@lowdefy/block-utils/registerHtmlEnhancements.js';

import initLowdefyContext from './initLowdefyContext.js';

function baseArgs(overrides = {}) {
  const lowdefy = {};
  return {
    auth: { user: null },
    Components: { Link: () => null },
    config: {
      pageConfig: { pageId: 'home' },
      rootConfig: {
        home: { configured: false, pageId: 'home' },
        menus: [],
        ...overrides,
      },
    },
    lowdefy,
    matchedPath: 'home',
    pathParams: {},
    router: { basePath: '' },
    stage: 'production',
    types: { actions: {}, blocks: {}, icons: {}, operators: {} },
    window: { document: {}, fetch: () => undefined },
  };
}

test('initLowdefyContext sets lowdefyApp from rootConfig', () => {
  const args = baseArgs({ lowdefyApp: { slug: 'my-app', version: '1.2.3' } });
  const result = initLowdefyContext(args);
  expect(result.lowdefyApp).toEqual({ slug: 'my-app', version: '1.2.3' });
});

test('initLowdefyContext leaves lowdefyApp undefined when rootConfig has none', () => {
  const args = baseArgs();
  const result = initLowdefyContext(args);
  expect(result.lowdefyApp).toBeUndefined();
});

test('initLowdefyContext sets lowdefyGlobal from rootConfig', () => {
  const args = baseArgs({ lowdefyGlobal: { key: 'value' } });
  const result = initLowdefyContext(args);
  expect(result.lowdefyGlobal).toEqual({ key: 'value' });
});

test('initLowdefyContext registers HTML links that build hrefs with basePath and navigate with link', () => {
  const args = baseArgs();
  args.router.basePath = '/app';
  const result = initLowdefyContext(args);
  const registration = getHtmlEnhancements();
  expect(registration.createHref({ pathname: '/contacts', query: 'id=1' })).toBe(
    '/app/contacts?id=1'
  );
  expect(registration.link).toBe(result._internal.link);
});

test('initLowdefyContext registers HTML page links that fill the page path from pathParams', () => {
  const args = baseArgs({ pagePaths: { ticket: 'tickets/{space}/{ticket_id}' } });
  args.config.pageConfig.linkPaths = {};
  args.router.basePath = '/app';
  initLowdefyContext(args);
  const registration = getHtmlEnhancements();
  expect(
    registration.createPageHref({
      pageId: 'ticket',
      pathParams: { space: 'support', ticket_id: '12' },
      urlQuery: { tab: 'notes' },
    })
  ).toBe('/app/tickets/support/12?tab=notes');
  expect(registration.createPageHref({ pageId: 'contacts', pathParams: {}, urlQuery: {} })).toBe(
    '/app/contacts'
  );
  expect(() =>
    registration.createPageHref({ pageId: 'ticket', pathParams: { space: 's' }, urlQuery: {} })
  ).toThrow('Link to page "ticket" is missing a value for path placeholder "ticket_id".');
});

test('initLowdefyContext registers the app locale and translate for HTML formatting', () => {
  const args = baseArgs();
  args.window.__lowdefy_locale = 'de-DE';
  const result = initLowdefyContext(args);
  const registration = getHtmlEnhancements();
  expect(registration.getLocale()).toBe('de-DE');
  expect(registration.translate).toBe(result._internal.translate);
});

test('initLowdefyContext writes the shown page to the path memory', () => {
  const args = baseArgs();
  args.config.pageConfig = {
    pageId: 'ticket',
    path: 'tickets/{space}/{ticket_id}',
  };
  args.matchedPath = 'tickets/a%2Bb/1';
  args.pathParams = { space: 'a+b', ticket_id: '1' };
  const result = initLowdefyContext(args);
  expect(result.pathMemory.get('tickets/a%2Bb/1')).toEqual({
    pageId: 'ticket',
    pathParams: { space: 'a+b', ticket_id: '1' },
    instanceKey: 'page:ticket#tickets/a%2Bb/1',
  });
});

test('initLowdefyContext keeps earlier path memory entries when the page changes', () => {
  const args = baseArgs();
  const lowdefy = initLowdefyContext(args);
  initLowdefyContext({
    ...args,
    config: { ...args.config, pageConfig: { pageId: 'other' } },
    lowdefy,
    matchedPath: 'other',
  });
  expect([...lowdefy.pathMemory.keys()]).toEqual(['home', 'other']);
  expect(lowdefy.pathMemory.get('other')).toEqual({
    pageId: 'other',
    pathParams: {},
    instanceKey: 'page:other',
  });
});

test('initLowdefyContext keeps the path memory when the context is initialised again', () => {
  const args = baseArgs();
  const lowdefy = initLowdefyContext(args);
  lowdefy._internal.initialised = false;
  initLowdefyContext({
    ...args,
    config: { ...args.config, pageConfig: { pageId: 'other' } },
    lowdefy,
    matchedPath: 'other',
  });
  expect([...lowdefy.pathMemory.keys()]).toEqual(['home', 'other']);
});

test('initLowdefyContext starts with no caller stamp', () => {
  const lowdefy = initLowdefyContext(baseArgs());
  expect(lowdefy._internal.callerStamp).toBe(null);
});

test('initLowdefyContext keeps the caller stamp when the context is initialised again', () => {
  const args = baseArgs();
  const lowdefy = initLowdefyContext(args);
  const stamp = { caller: 'abc', session: null, roles: null, memberships: null };
  lowdefy._internal.callerStamp = stamp;
  lowdefy._internal.initialised = false;
  initLowdefyContext({ ...args, lowdefy });
  expect(lowdefy._internal.callerStamp).toBe(stamp);
});

test('initLowdefyContext keys storage by the app slug, base path and signed-in user', () => {
  const args = baseArgs({ lowdefyApp: { slug: 'sales' } });
  args.router.basePath = '/crm';
  args.auth = { user: { id: 'u1' } };
  const result = initLowdefyContext(args);
  expect(result._internal.storage.appKey('lf-sider-open')).toBe('lowdefy:sales:/crm:lf-sider-open');
  expect(result._internal.storage.userKey('views')).toBe(
    'lowdefy:sales:/crm:lowdefy_user:u1:views'
  );
});

test('initLowdefyContext clears user storage another person left on the browser', () => {
  window.localStorage.clear();
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  window.localStorage.setItem('lowdefy:sales::lowdefy_darkMode', 'dark');
  const args = baseArgs({ lowdefyApp: { slug: 'sales' } });
  args.auth = { user: { id: 'u2' } };
  args.window = window;
  initLowdefyContext(args);
  expect(Object.keys(window.localStorage)).toEqual(['lowdefy:sales::lowdefy_darkMode']);
});

test('initLowdefyContext keeps user storage of the person signed in', () => {
  window.localStorage.clear();
  window.localStorage.setItem('lowdefy:sales::lowdefy_user:u1:views', '{}');
  const args = baseArgs({ lowdefyApp: { slug: 'sales' } });
  args.auth = { user: { id: 'u1' } };
  args.window = window;
  initLowdefyContext(args);
  expect(window.localStorage.getItem('lowdefy:sales::lowdefy_user:u1:views')).toBe('{}');
});
