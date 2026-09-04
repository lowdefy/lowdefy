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

import createLink from '../src/createLink.js';

// resolveTarget's url origin classification reads the window origin and basePath,
// so url cases need a fixture that provides them (matching resolveTarget.test.js).
function createLowdefy({ inputs = {}, home, basePath, origin = 'https://app.lowdefy.test' } = {}) {
  const lowdefy = { inputs, _internal: { globals: { window: { location: { origin } } } } };
  if (home !== undefined) {
    lowdefy.home = home;
  }
  if (basePath !== undefined) {
    lowdefy.basePath = basePath;
  }
  return lowdefy;
}

const mockBackLink = jest.fn();
const mockDisabledLink = jest.fn();
const mockNewOriginLink = jest.fn();
const mockNoLink = jest.fn();
const mockSameOriginLink = jest.fn();

beforeEach(() => {
  mockBackLink.mockReset();
  mockDisabledLink.mockReset();
  mockNewOriginLink.mockReset();
  mockNoLink.mockReset();
  mockSameOriginLink.mockReset();
});

test('createLink, link with pageId', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1' });
  link({ pageId: 'page_1', urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "pageId": "page_1",
          "pathname": "/page_1",
          "query": "",
          "setInput": [Function],
        },
      ],
      Array [
        Object {
          "pageId": "page_1",
          "pathname": "/page_1",
          "query": "p=3",
          "setInput": [Function],
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
  mockSameOriginLink.mock.calls[0][0].setInput();
  expect(lowdefy.inputs).toEqual({
    'page:page_1': {},
  });
  mockSameOriginLink.mock.calls[1][0].setInput();
  expect(lowdefy.inputs).toEqual({
    'page:page_1': {},
  });
});

test('createLink, link with pageId new tab', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', newTab: true });
  link({ pageId: 'page_1', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "newTab": true,
          "pageId": "page_1",
          "pathname": "/page_1",
          "query": "",
          "setInput": [Function],
        },
      ],
      Array [
        Object {
          "newTab": true,
          "pageId": "page_1",
          "pathname": "/page_1",
          "query": "p=3",
          "setInput": [Function],
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
});

test('createLink, link with pageId with inputs', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', input: { a: 1 } });
  link({ pageId: 'page_2', input: { a: 2 }, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "input": Object {
            "a": 1,
          },
          "pageId": "page_1",
          "pathname": "/page_1",
          "query": "",
          "setInput": [Function],
        },
      ],
      Array [
        Object {
          "input": Object {
            "a": 2,
          },
          "pageId": "page_2",
          "pathname": "/page_2",
          "query": "p=3",
          "setInput": [Function],
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
  mockSameOriginLink.mock.calls[0][0].setInput();
  mockSameOriginLink.mock.calls[1][0].setInput();
  expect(lowdefy.inputs).toEqual({
    'page:page_1': { a: 1 },
    'page:page_2': { a: 2 },
  });
});

test('createLink, link with url and protocol', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'http://localhost:8080/test' });
  link({ url: 'http://localhost:8080/test', urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  // The resolver returns a whole href for an external target with urlQuery
  // already folded in, so the separate query arg is always empty.
  expect(mockNewOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "query": "",
          "url": "http://localhost:8080/test",
        },
      ],
      Array [
        Object {
          "query": "",
          "url": "http://localhost:8080/test?p=3",
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with url new tab and protocol', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'http://localhost:8080/test', newTab: true });
  link({ url: 'http://localhost:8080/test', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "newTab": true,
          "query": "",
          "url": "http://localhost:8080/test",
        },
      ],
      Array [
        Object {
          "newTab": true,
          "query": "",
          "url": "http://localhost:8080/test?p=3",
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with url and no protocol', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'external.com/test', newTab: true });
  link({ url: 'external.com/test', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "newTab": true,
          "query": "",
          "url": "https://external.com/test",
        },
      ],
      Array [
        Object {
          "newTab": true,
          "query": "",
          "url": "https://external.com/test?p=3",
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with leading-slash url navigates to an in-app page', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: '/foo' });
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "pathname": "/foo",
          "query": "",
          "setInput": [Function],
          "url": "/foo",
        },
      ],
    ]
  `);
  // A url names no page, so setInput is a no-op - it must never write
  // inputs['page:undefined'].
  mockSameOriginLink.mock.calls[0][0].setInput();
  expect(lowdefy.inputs).toEqual({});
});

test('createLink, link with same-origin absolute url is a soft in-app navigation', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'https://app.lowdefy.test/reports?a=1' });
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "pathname": "/reports",
          "query": "a=1",
          "setInput": [Function],
          "url": "https://app.lowdefy.test/reports?a=1",
        },
      ],
    ]
  `);
  mockSameOriginLink.mock.calls[0][0].setInput();
  expect(lowdefy.inputs).toEqual({});
});

test('createLink, link with off-origin url is an external navigation', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'https://example.com/page' });
  expect(mockSameOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "query": "",
          "url": "https://example.com/page",
        },
      ],
    ]
  `);
});

test('createLink, link with home, not configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home', configured: false } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true });
  link({ home: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "home": true,
          "pathname": "/home",
          "query": "",
          "setInput": [Function],
        },
      ],
      Array [
        Object {
          "home": true,
          "pathname": "/home",
          "query": "p=3",
          "setInput": [Function],
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
  mockSameOriginLink.mock.calls[0][0].setInput();
  expect(lowdefy.inputs).toEqual({
    'page:home': {},
  });
  mockSameOriginLink.mock.calls[1][0].setInput();
  expect(lowdefy.inputs).toEqual({
    'page:home': {},
  });
});

test('createLink, link with home, configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home', configured: true } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true });
  link({ home: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "home": true,
          "pathname": "/",
          "query": "",
          "setInput": [Function],
        },
      ],
      Array [
        Object {
          "home": true,
          "pathname": "/",
          "query": "p=3",
          "setInput": [Function],
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
});

test('createLink, link with home new tab, not configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, newTab: true });
  link({ home: true, newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "home": true,
          "newTab": true,
          "pathname": "/home",
          "query": "",
          "setInput": [Function],
        },
      ],
      Array [
        Object {
          "home": true,
          "newTab": true,
          "pathname": "/home",
          "query": "p=3",
          "setInput": [Function],
          "urlQuery": Object {
            "p": 3,
          },
        },
      ],
    ]
  `);
});

test('createLink, link with home with inputs, not configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, input: { a: 1 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "home": true,
          "input": Object {
            "a": 1,
          },
          "pathname": "/home",
          "query": "",
          "setInput": [Function],
        },
      ],
    ]
  `);
  mockSameOriginLink.mock.calls[0][0].setInput();
  expect(lowdefy.inputs).toEqual({
    'page:home': { a: 1 },
  });
});

test('createLink, link with home calls noLink when the home config names no page', () => {
  // What getHomeAndMenus returns for an app with no homePageId and no menu link
  // to fall back on. Unguarded this pushed "/undefined" into history.
  const lowdefy = { inputs: {}, home: { configured: false, pageId: null } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([[{ home: true }]]);
  expect(lowdefy.inputs).toEqual({});
});

test('createLink, link with home calls noLink when there is no home config at all', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, input: { a: 1 } });
  expect(mockSameOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([[{ home: true, input: { a: 1 } }]]);
  expect(lowdefy.inputs).toEqual({});
});

test('createLink, no params calls noLink', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({});
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([[{}]]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, disabled calls disabledLink', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ disabled: true, home: true });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([
    [
      {
        disabled: true,
        home: true,
      },
    ],
  ]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with back', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ back: true });
  expect(mockBackLink.mock.calls).toEqual([
    [
      {
        back: true,
      },
    ],
  ]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, more than one grammar key throws the resolver ambiguity error', () => {
  const lowdefy = createLowdefy();
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  expect(() =>
    link({ pageId: 'page_1', url: 'https://example.com' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Link: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined."`
  );
});

test('createLink, replace and scroll are passed through to sameOriginLink', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', replace: true, scroll: false });
  expect(mockSameOriginLink.mock.calls[0][0]).toMatchObject({
    pathname: '/page_1',
    replace: true,
    scroll: false,
  });
});

function createLowdefyOnPage({ pageId = 'page_1', pathname = '/page_1', basePath } = {}) {
  const triggerEvent = jest.fn();
  const lowdefy = {
    basePath,
    contexts: {
      [`page:${pageId}`]: {
        _internal: {
          RootSlots: { map: { [pageId]: { id: `block:${pageId}`, triggerEvent } } },
        },
      },
    },
    inputs: {},
    pageId,
    _internal: {
      globals: { window: { location: { origin: 'https://app.lowdefy.test', pathname } } },
      progress: { dispatch: jest.fn() },
    },
  };
  return { lowdefy, triggerEvent };
}

function linkOn(lowdefy) {
  return createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
}

test('createLink, reload true on the page already open re-runs its mount events', async () => {
  const { lowdefy, triggerEvent } = createLowdefyOnPage();
  linkOn(lowdefy)({ pageId: 'page_1', reload: true });
  await mockSameOriginLink.mock.calls[0][0].setInput();

  expect(triggerEvent.mock.calls.map(([{ name }]) => name)).toEqual(['onMount', 'onMountAsync']);
  expect(lowdefy.inputs).toEqual({ 'page:page_1': {} });
});

test('createLink, reload true matches the current page under a basePath', async () => {
  const { lowdefy, triggerEvent } = createLowdefyOnPage({
    basePath: '/app',
    pathname: '/app/page_1',
  });
  linkOn(lowdefy)({ pageId: 'page_1', reload: true });
  await mockSameOriginLink.mock.calls[0][0].setInput();

  expect(triggerEvent).toHaveBeenCalled();
});

test('createLink, reload true on a link to another page does not re-run mount events', async () => {
  const { lowdefy, triggerEvent } = createLowdefyOnPage();
  linkOn(lowdefy)({ pageId: 'page_2', reload: true });
  await mockSameOriginLink.mock.calls[0][0].setInput();

  expect(triggerEvent).not.toHaveBeenCalled();
});

test('createLink, a link to the page already open without reload does not re-run mount events', async () => {
  const { lowdefy, triggerEvent } = createLowdefyOnPage();
  linkOn(lowdefy)({ pageId: 'page_1' });
  await mockSameOriginLink.mock.calls[0][0].setInput();

  expect(triggerEvent).not.toHaveBeenCalled();
});
