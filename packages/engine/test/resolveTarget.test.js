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

import resolveTarget from '../src/resolveTarget.js';

function createLowdefy({
  basePath,
  home,
  origin = 'https://app.lowdefy.test',
  href = `${origin}${basePath ?? ''}/admin/current?tab=1`,
} = {}) {
  const lowdefy = {
    linkPaths: {},
    pagePaths: {},
    pathMemory: new Map(),
    _internal: { globals: { window: { location: { href, origin } } } },
  };
  if (basePath !== undefined) {
    lowdefy.basePath = basePath;
  }
  if (home !== undefined) {
    lowdefy.home = home;
  }
  return lowdefy;
}

test('resolveTarget returns undefined when target is not an object', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: undefined })).toBeUndefined();
  expect(resolveTarget({ lowdefy: createLowdefy(), target: 'string' })).toBeUndefined();
});

test('resolveTarget returns undefined when nothing in the grammar matches', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: {} })).toBeUndefined();
});

test('resolveTarget resolves home to the app root when a homePageId is configured', () => {
  const lowdefy = createLowdefy({ home: { configured: true, pageId: 'dashboard' } });
  expect(resolveTarget({ lowdefy, target: { home: true } })).toEqual({
    kind: 'page',
    pathname: '/',
    query: '',
    pageId: 'dashboard',
    pathParams: {},
    instanceKey: 'page:dashboard',
  });
});

test('resolveTarget resolves home to the menu-derived pageId when no homePageId is configured', () => {
  const lowdefy = createLowdefy({ home: { configured: false, pageId: 'first-page' } });
  expect(resolveTarget({ lowdefy, target: { home: true } })).toEqual({
    kind: 'page',
    pathname: '/first-page',
    query: '',
    pageId: 'first-page',
    pathParams: {},
    instanceKey: 'page:first-page',
  });
});

test('resolveTarget carries urlQuery on a home target', () => {
  const lowdefy = createLowdefy({ home: { configured: true, pageId: 'dashboard' } });
  expect(resolveTarget({ lowdefy, target: { home: true, urlQuery: { p: 3 } } })).toEqual({
    kind: 'page',
    pathname: '/',
    query: 'p=3',
    pageId: 'dashboard',
    pathParams: {},
    instanceKey: 'page:dashboard',
  });
});

test('resolveTarget returns undefined for an unresolvable home, never building "/undefined"', () => {
  const lowdefy = createLowdefy({ home: { configured: false, pageId: null } });
  expect(resolveTarget({ lowdefy, target: { home: true } })).toBeUndefined();
});

test('resolveTarget returns undefined for home when there is no home config at all', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { home: true } })).toBeUndefined();
});

test('resolveTarget resolves a pageId without urlQuery', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { pageId: 'page_1' } })).toEqual({
    kind: 'page',
    pathname: '/page_1',
    query: '',
    pageId: 'page_1',
    pathParams: {},
    instanceKey: 'page:page_1',
  });
});

test('resolveTarget resolves a pageId with urlQuery', () => {
  expect(
    resolveTarget({ lowdefy: createLowdefy(), target: { pageId: 'page_1', urlQuery: { p: 3 } } })
  ).toEqual({
    kind: 'page',
    pathname: '/page_1',
    query: 'p=3',
    pageId: 'page_1',
    pathParams: {},
    instanceKey: 'page:page_1',
  });
});

test('resolveTarget throws when more than one of home, pageId or url is defined', () => {
  expect(() =>
    resolveTarget({
      lowdefy: createLowdefy(),
      target: { pageId: 'expired', url: 'https://example.com/expired' },
    })
  ).toThrow(
    `Invalid Link: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined.`
  );
});

test('resolveTarget interpolates the name into the ambiguity error message', () => {
  expect(() =>
    resolveTarget({
      lowdefy: createLowdefy(),
      target: { home: true, pageId: 'expired' },
      name: 'callbackUrl',
    })
  ).toThrow(
    `Invalid callbackUrl: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined.`
  );
});

test('resolveTarget classifies a leading-slash url as an app-relative page', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url: '/foo' } })).toEqual({
    kind: 'page',
    pathname: '/foo',
    query: '',
  });
});

test('resolveTarget keeps /2fa a page without gaining an https scheme', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url: '/2fa' } })).toEqual({
    kind: 'page',
    pathname: '/2fa',
    query: '',
  });
});

test('resolveTarget keeps the query a leading-slash url carries', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url: '/2fa?theme=dark' } })).toEqual({
    kind: 'page',
    pathname: '/2fa',
    query: 'theme=dark',
  });
});

test('resolveTarget combines a leading-slash url query with the target urlQuery', () => {
  expect(
    resolveTarget({
      lowdefy: createLowdefy(),
      target: { url: '/2fa?theme=dark', urlQuery: { p: 3 } },
    })
  ).toEqual({
    kind: 'page',
    pathname: '/2fa',
    query: 'theme=dark&p=3',
  });
});

test('resolveTarget classifies a schemeless host as an external https url', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url: 'example.com' } })).toEqual({
    kind: 'external',
    href: 'https://example.com/',
  });
});

test('resolveTarget classifies an absolute same-origin url inside basePath as a page, stripped', () => {
  const lowdefy = createLowdefy({ basePath: '/app' });
  expect(
    resolveTarget({ lowdefy, target: { url: 'https://app.lowdefy.test/app/reports' } })
  ).toEqual({
    kind: 'page',
    pathname: '/reports',
    query: '',
  });
});

test('resolveTarget classifies an absolute same-origin url outside basePath as external', () => {
  const lowdefy = createLowdefy({ basePath: '/app' });
  expect(resolveTarget({ lowdefy, target: { url: 'https://app.lowdefy.test/marketing' } })).toEqual(
    {
      kind: 'external',
      href: 'https://app.lowdefy.test/marketing',
    }
  );
});

test('resolveTarget classifies a same-origin url as a page when no basePath is set', () => {
  const lowdefy = createLowdefy();
  expect(
    resolveTarget({ lowdefy, target: { url: 'https://app.lowdefy.test/reports?a=1' } })
  ).toEqual({
    kind: 'page',
    pathname: '/reports',
    query: 'a=1',
  });
});

test('resolveTarget classifies a different-origin url as external', () => {
  const lowdefy = createLowdefy();
  expect(resolveTarget({ lowdefy, target: { url: 'https://example.com/page' } })).toEqual({
    kind: 'external',
    href: 'https://example.com/page',
  });
});

test('resolveTarget returns undefined for a url reaching origin classification with no window', () => {
  const lowdefy = { _internal: { globals: {} } };
  expect(resolveTarget({ lowdefy, target: { url: 'https://example.com/page' } })).toBeUndefined();
});

test('resolveTarget resolves a leading-slash url without a window (no origin needed)', () => {
  const lowdefy = { _internal: { globals: {} } };
  expect(resolveTarget({ lowdefy, target: { url: '/foo' } })).toEqual({
    kind: 'page',
    pathname: '/foo',
    query: '',
  });
});

test('resolveTarget folds urlQuery into an external href', () => {
  expect(
    resolveTarget({ lowdefy: createLowdefy(), target: { url: 'example.com', urlQuery: { a: 1 } } })
  ).toEqual({
    kind: 'external',
    href: 'https://example.com/?a=1',
  });
});

test('resolveTarget combines an external url query with the target urlQuery', () => {
  expect(
    resolveTarget({
      lowdefy: createLowdefy(),
      target: { url: 'https://example.com/x?theme=dark#frag', urlQuery: { a: 1 } },
    })
  ).toEqual({
    kind: 'external',
    href: 'https://example.com/x?theme=dark&a=1#frag',
  });
});

test('resolveTarget folds urlQuery into an absolute same-origin page url', () => {
  const lowdefy = createLowdefy({ basePath: '/app' });
  expect(
    resolveTarget({
      lowdefy,
      target: { url: 'https://app.lowdefy.test/app/reports?theme=dark', urlQuery: { a: 1 } },
    })
  ).toEqual({
    kind: 'page',
    pathname: '/reports',
    query: 'theme=dark&a=1',
  });
});

test.each([
  [
    'a fragment moves within the current page',
    '#products',
    undefined,
    { kind: 'external', href: '#products' },
  ],
  [
    'a fragment keeps the urlQuery',
    '#products',
    { a: 1 },
    { kind: 'external', href: '?a=1#products' },
  ],
  [
    'a query alone is the current page with that query',
    '?q=1',
    { a: 1 },
    { kind: 'page', pathname: '/admin/current', query: 'q=1&a=1' },
  ],
  [
    'a dot path is relative to the current page',
    './reports?x=1',
    undefined,
    { kind: 'page', pathname: '/admin/reports', query: 'x=1' },
  ],
  [
    'a parent path is relative to the current page',
    '../reports',
    undefined,
    { kind: 'page', pathname: '/reports', query: '' },
  ],
  [
    'mailto keeps its address',
    'mailto:help@example.com',
    { subject: 'Hi there' },
    { kind: 'external', href: 'mailto:help@example.com?subject=Hi+there' },
  ],
  [
    'tel keeps its number',
    'tel:+27123456789',
    undefined,
    { kind: 'external', href: 'tel:+27123456789' },
  ],
  [
    'an app scheme keeps its host',
    'myapp://open/item?id=4',
    undefined,
    { kind: 'external', href: 'myapp://open/item?id=4' },
  ],
  [
    'a protocol-relative url to another host is external',
    '//example.com/x',
    undefined,
    { kind: 'external', href: 'https://example.com/x' },
  ],
  [
    'a backslash url to another host is external',
    '/\\example.com/x',
    undefined,
    { kind: 'external', href: 'https://example.com/x' },
  ],
  [
    'a protocol-relative url to this origin is a page',
    '//app.lowdefy.test/app/reports',
    undefined,
    { kind: 'page', pathname: '/reports', query: '' },
  ],
])('resolveTarget url: %s', (_, url, urlQuery, expected) => {
  const lowdefy = createLowdefy({ basePath: '/app' });
  expect(resolveTarget({ lowdefy, target: { url, urlQuery } })).toEqual(expected);
});

test.each([
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  'java\tscript:alert(1)',
  'vbscript:msgbox(1)',
  'data:text/html,<script>alert(1)</script>',
])('resolveTarget resolves no target for the script url %s', (url) => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url } })).toBeUndefined();
});

test('resolveTarget resolves a fragment without a window', () => {
  const lowdefy = { _internal: { globals: {} } };
  expect(resolveTarget({ lowdefy, target: { url: '#top' } })).toEqual({
    kind: 'external',
    href: '#top',
  });
});

test.each([
  ['a tab', '/\t/example.com/x'],
  ['a newline', '/\n/example.com/x'],
  ['a carriage return', '/\r/example.com/x'],
  ['a leading space', ' //example.com/x'],
  ['a leading control character', '\u0001//example.com/x'],
])('resolveTarget reads a url with %s the way the URL parser does, as another host', (_, url) => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url } })).toEqual({
    kind: 'external',
    href: 'https://example.com/x',
  });
});

test('resolveTarget trims spaces around an app path', () => {
  expect(resolveTarget({ lowdefy: createLowdefy(), target: { url: ' /page\n' } })).toEqual({
    kind: 'page',
    pathname: '/page',
    query: '',
  });
});

test.each(['not a url', 'http://', 'https://exa mple.com', ' \t '])(
  'resolveTarget resolves no target for the unparseable url %j',
  (url) => {
    expect(resolveTarget({ lowdefy: createLowdefy(), target: { url } })).toBeUndefined();
  }
);

function createPathsLowdefy({ linkPaths = {}, pagePaths = {} } = {}) {
  const lowdefy = createLowdefy();
  lowdefy.linkPaths = linkPaths;
  lowdefy.pagePaths = pagePaths;
  return lowdefy;
}

test('resolveTarget builds a patterned page path from pagePaths and remembers it', () => {
  const lowdefy = createPathsLowdefy({ pagePaths: { ticket: 'tickets/{space}/{ticket_id}' } });
  const target = resolveTarget({
    lowdefy,
    target: { pageId: 'ticket', pathParams: { space: 's', ticket_id: 1 }, urlQuery: { tab: 2 } },
  });
  expect(target).toEqual({
    kind: 'page',
    pathname: '/tickets/s/1',
    query: 'tab=2',
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
    instanceKey: 'page:ticket#tickets/s/1',
  });
  expect(lowdefy.pathMemory.get('tickets/s/1')).toEqual({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
    instanceKey: 'page:ticket#tickets/s/1',
  });
});

test('resolveTarget builds a page in neither paths list at its id', () => {
  const lowdefy = createPathsLowdefy();
  const target = resolveTarget({
    lowdefy,
    target: { pageId: 'ticket', pathParams: { space: 's', ticket_id: 1 } },
  });
  expect(target.pathname).toEqual('/ticket');
  expect(target.pathParams).toEqual({});
  expect(target.instanceKey).toEqual('page:ticket');
  expect(lowdefy.pathMemory.get('ticket').pageId).toEqual('ticket');
});

test('resolveTarget prefers the page linkPaths over pagePaths', () => {
  const lowdefy = createPathsLowdefy({
    linkPaths: { ticket: 'support/{ticket_id}' },
    pagePaths: { ticket: 'tickets/{ticket_id}' },
  });
  expect(
    resolveTarget({ lowdefy, target: { pageId: 'ticket', pathParams: { ticket_id: 'a/b' } } })
      .pathname
  ).toEqual('/support/a%2Fb');
});

test('resolveTarget throws a ConfigError naming the page and a missing placeholder', () => {
  const lowdefy = createPathsLowdefy({ pagePaths: { ticket: 'tickets/{space}/{ticket_id}' } });
  let error;
  try {
    resolveTarget({ lowdefy, target: { pageId: 'ticket', pathParams: { space: 's' } } });
  } catch (e) {
    error = e;
  }
  expect(error.name).toEqual('ConfigError');
  expect(error.message).toEqual(
    'Link to page "ticket" is missing a value for path placeholder "ticket_id".'
  );
  expect(lowdefy.pathMemory.size).toBe(0);
});

test('resolveTarget builds a patterned home page with its values', () => {
  const lowdefy = createPathsLowdefy({ pagePaths: { board: 'boards/{board}' } });
  lowdefy.home = { configured: false, pageId: 'board', pathParams: { board: 'main' } };
  expect(resolveTarget({ lowdefy, target: { home: true } })).toEqual({
    kind: 'page',
    pathname: '/boards/main',
    query: '',
    pageId: 'board',
    pathParams: { board: 'main' },
    instanceKey: 'page:board#boards/main',
  });
});

test('resolveTarget leaves the path memory alone for a url target', () => {
  const lowdefy = createPathsLowdefy();
  expect(resolveTarget({ lowdefy, target: { url: '/tickets/s/1' } })).toEqual({
    kind: 'page',
    pathname: '/tickets/s/1',
    query: '',
  });
  expect(lowdefy.pathMemory.size).toBe(0);
});
