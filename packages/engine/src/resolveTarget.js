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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

import getHomePathname from './getHomePathname.js';

// The target's own urlQuery combines with any query the url string already
// carries, matching the grammar semantics createLink resolved before.
function combineQuery(ownQuery, query) {
  return [ownQuery, query].filter((part) => part !== '').join('&');
}

// Classifies a `url` grammar value into a page or external target. basePath is
// stripped here, never applied - the single application boundary is createUrl.
function classifyUrl({ lowdefy, url, query }) {
  // The leading-slash test runs before the colon-less test: `/2fa` is an
  // app-relative page and colon-less, and the colon-less branch would wrongly
  // give it an `https://` scheme and parse it as an off-app origin.
  if (url.startsWith('/')) {
    const questionMark = url.indexOf('?');
    const pathname = questionMark === -1 ? url : url.slice(0, questionMark);
    const ownQuery = questionMark === -1 ? '' : url.slice(questionMark + 1);
    return { kind: 'page', pathname, query: combineQuery(ownQuery, query) };
  }

  // A colon-less value like `example.com` is a schemeless hostname, not a path -
  // prepend `https://` so the URL parser reads it as an absolute URL rather than
  // the app-relative path `/example.com`. Confined to here by the leading-slash
  // test above, so a colon-bearing path like `/path:1` never reaches it.
  const value = url.includes(':') ? url : `https://${url}`;

  const origin = lowdefy._internal?.globals?.window?.location?.origin;
  // No window (SSR, tests): a `url` that reaches origin classification cannot be
  // placed, so it resolves to nothing rather than dereferencing a missing window.
  if (type.isNone(origin)) {
    return undefined;
  }

  const parsed = new URL(value, origin);
  const basePath = lowdefy.basePath ?? '';
  if (parsed.origin === origin) {
    const insideBasePath = basePath === '' || parsed.pathname.startsWith(basePath);
    if (insideBasePath) {
      // Strip basePath so the router does not re-apply it: an absolute
      // `https://myapp.com/app/reports` under basePath `/app` already carries the
      // prefix, and without stripping router.push would push `/app/app/reports`.
      const pathname = parsed.pathname.startsWith(basePath)
        ? parsed.pathname.slice(basePath.length)
        : parsed.pathname;
      return {
        kind: 'page',
        pathname,
        query: combineQuery(parsed.search.replace(/^\?/, ''), query),
      };
    }
    // Same origin but outside basePath (a marketing page at the origin root while
    // the app lives at `/app`) is a whole URL - routing it would 404 in `/app`.
    return externalTarget({ parsed, query });
  }
  return externalTarget({ parsed, query });
}

// An external target is handed on as one finished href, so the target's own
// urlQuery has to be folded in here - the consumer has no separate query to
// append once the value is a whole URL.
function externalTarget({ parsed, query }) {
  const search = combineQuery(parsed.search.replace(/^\?/, ''), query);
  const href = `${parsed.origin}${parsed.pathname}${search === '' ? '' : `?${search}`}${
    parsed.hash
  }`;
  return { kind: 'external', href };
}

// The single resolver of the navigation grammar { home, pageId, url, urlQuery }
// for every reader. Returns a discriminated, un-prefixed target - never a string,
// never basePath-prefixed - so the page/external distinction is data the consumer
// reads rather than a shape it guesses from a leading slash.
function resolveTarget({ lowdefy, target, name = 'Link' }) {
  if (!type.isObject(target)) {
    return undefined;
  }
  const { home, pageId, url, urlQuery } = target;

  const defined = [home, pageId, url].filter((value) => value);
  if (defined.length > 1) {
    throw new Error(
      `Invalid ${name}: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined.`
    );
  }

  const query = type.isNone(urlQuery) ? '' : `${urlQueryFn.stringify(urlQuery)}`;

  if (home === true) {
    const pathname = getHomePathname({ lowdefy });
    // An app whose home config names no page has no resolvable home - propagate
    // getHomePathname's undefined rather than building the literal "/undefined".
    if (type.isNone(pathname)) {
      return undefined;
    }
    return { kind: 'page', pathname, query };
  }
  if (type.isString(pageId)) {
    return { kind: 'page', pathname: `/${pageId}`, query };
  }
  if (type.isString(url)) {
    return classifyUrl({ lowdefy, url, query });
  }
  return undefined;
}

export default resolveTarget;
