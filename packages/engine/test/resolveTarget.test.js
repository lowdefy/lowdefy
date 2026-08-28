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

function createLowdefy({ basePath, home, origin = 'https://app.lowdefy.test' } = {}) {
  const lowdefy = {
    _internal: { globals: { window: { location: { origin } } } },
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
  });
});

test('resolveTarget resolves home to the menu-derived pageId when no homePageId is configured', () => {
  const lowdefy = createLowdefy({ home: { configured: false, pageId: 'first-page' } });
  expect(resolveTarget({ lowdefy, target: { home: true } })).toEqual({
    kind: 'page',
    pathname: '/first-page',
    query: '',
  });
});

test('resolveTarget carries urlQuery on a home target', () => {
  const lowdefy = createLowdefy({ home: { configured: true, pageId: 'dashboard' } });
  expect(resolveTarget({ lowdefy, target: { home: true, urlQuery: { p: 3 } } })).toEqual({
    kind: 'page',
    pathname: '/',
    query: 'p=3',
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
  });
});

test('resolveTarget resolves a pageId with urlQuery', () => {
  expect(
    resolveTarget({ lowdefy: createLowdefy(), target: { pageId: 'page_1', urlQuery: { p: 3 } } })
  ).toEqual({
    kind: 'page',
    pathname: '/page_1',
    query: 'p=3',
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
