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

import { ConfigError } from '@lowdefy/errors';
import { buildPagePath, type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

import getHomePathname from './getHomePathname.js';
import rememberPath from './rememberPath.js';

// The target's own urlQuery combines with any query the url string already
// carries, matching the grammar semantics createLink resolved before.
function combineQuery(ownQuery, query) {
  return [ownQuery, query].filter((part) => part !== '').join('&');
}

// "/reports" is an app page. "//host" and "/\host" start with a slash too, but
// the URL parser reads both as a link to another host.
const appPathPattern = /^\/(?![/\\])/;
// Relative to the current page: a query alone ("?tab=2"), a dot path
// ("./reports", "../reports"), or a protocol-relative url ("//host/x").
const relativePattern = /^(\?|\.|\/)/;
// Schemes that run script when navigated to.
const scriptProtocols = new Set(['javascript:', 'vbscript:', 'data:']);

// The URL parser removes tabs and newlines anywhere, and strips leading and
// trailing C0 controls and spaces, before it reads a url. Classifying the string
// it reads keeps "/\t/host" (a link to another host) from passing as an app path.
function normalizeUrl(url) {
  const value = url.replace(/[\t\n\r]/g, '');
  let start = 0;
  let end = value.length;
  while (start < end && value.charCodeAt(start) <= 0x20) start += 1;
  while (end > start && value.charCodeAt(end - 1) <= 0x20) end -= 1;
  return value.slice(start, end);
}

// A url is data an app may take from the query string or a database, and the
// URL parser is the only complete check of it, so a value it rejects resolves
// to no target instead of throwing while a link renders.
function parseUrl(value, base) {
  try {
    return new URL(value, base);
  } catch (error) {
    return null;
  }
}

// Classifies a `url` grammar value into a page or external target. basePath is
// stripped here, never applied - the single application boundary is createUrl.
function classifyUrl({ lowdefy, url: rawUrl, query }) {
  const url = normalizeUrl(rawUrl);
  if (url === '') {
    return undefined;
  }
  // The leading-slash test runs before the colon-less test: `/2fa` is an
  // app-relative page and colon-less, and the colon-less branch would wrongly
  // give it an `https://` scheme and parse it as an off-app origin.
  if (appPathPattern.test(url)) {
    const questionMark = url.indexOf('?');
    const pathname = questionMark === -1 ? url : url.slice(0, questionMark);
    const ownQuery = questionMark === -1 ? '' : url.slice(questionMark + 1);
    return { kind: 'page', pathname, query: combineQuery(ownQuery, query) };
  }

  // A fragment moves within the current document, which only the browser can
  // do: the router has no fragment, and a push re-renders and scrolls to the top.
  if (url.startsWith('#')) {
    return { kind: 'external', href: query === '' ? url : `?${query}${url}` };
  }

  const location = lowdefy._internal?.globals?.window?.location;
  // No window (SSR, tests): a `url` that reaches origin classification cannot be
  // placed, so it resolves to nothing rather than dereferencing a missing window.
  if (type.isNone(location?.origin)) {
    return undefined;
  }
  const { origin } = location;

  // Any other colon-less value like `example.com` is a schemeless hostname, not
  // a path - prepend `https://` so the URL parser reads it as an absolute URL
  // rather than the app-relative path `/example.com`. Confined to here by the
  // leading-slash test above, so a colon-bearing path like `/path:1` never
  // reaches it.
  const relative = relativePattern.test(url);
  const value = relative || url.includes(':') ? url : `https://${url}`;
  const parsed = parseUrl(value, relative ? location.href : origin);

  if (parsed === null || scriptProtocols.has(parsed.protocol)) {
    return undefined;
  }
  // mailto:, tel: and app schemes have no origin; they are whole URLs.
  if (parsed.origin === 'null') {
    return externalTarget({ parsed, query });
  }
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
// append once the value is a whole URL. The URL object writes it back, so a
// scheme without an origin (mailto:) keeps its own shape.
function externalTarget({ parsed, query }) {
  const target = new URL(parsed.href);
  target.search = combineQuery(parsed.search.replace(/^\?/, ''), query);
  return { kind: 'external', href: target.href };
}

// The pattern of a page the current page links to: the page's own linkPaths (patterned pages its
// collected links target), then the patterned pages the user may open. A page in neither is served
// at its id.
function getPagePattern({ lowdefy, pageId }) {
  return lowdefy.linkPaths[pageId] ?? lowdefy.pagePaths[pageId];
}

// A page target names the page, its values and the instance they open, and the path memory learns
// the path before any router push.
function pageTarget({ lowdefy, pathname, pageId, pathParams, pattern, query }) {
  const { instanceKey, pathParams: values } = rememberPath({
    lowdefy,
    path: pathname.slice(1),
    pageId,
    pathParams,
    pattern,
  });
  return { kind: 'page', pathname, query, pageId, pathParams: values, instanceKey };
}

function buildPathname({ pageId, pathParams, pattern }) {
  try {
    return `/${buildPagePath({ pageId, path: pattern, pathParams })}`;
  } catch (error) {
    throw new ConfigError(error.message, { cause: error });
  }
}

// The single resolver of the navigation grammar { home, pageId, url, urlQuery, pathParams }
// for every reader. Returns a discriminated, un-prefixed target - never a string,
// never basePath-prefixed - so the page/external distinction is data the consumer
// reads rather than a shape it guesses from a leading slash.
function resolveTarget({ lowdefy, target, name = 'Link' }) {
  if (!type.isObject(target)) {
    return undefined;
  }
  const { home, pageId, pathParams, url, urlQuery } = target;
  const defined = [home, pageId, url].filter((value) => value);
  if (defined.length > 1) {
    throw new ConfigError(
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
    return pageTarget({
      lowdefy,
      pathname,
      pageId: lowdefy.home.pageId,
      pathParams: lowdefy.home.pathParams,
      pattern: lowdefy.pagePaths[lowdefy.home.pageId],
      query,
    });
  }
  if (type.isString(pageId)) {
    const pattern = getPagePattern({ lowdefy, pageId });
    return pageTarget({
      lowdefy,
      pathname: buildPathname({ pageId, pathParams, pattern }),
      pageId,
      pathParams,
      pattern,
      query,
    });
  }
  if (type.isString(url) && url !== '') {
    return classifyUrl({ lowdefy, url, query });
  }
  // An empty url string is absence of a target, not the origin root: it is
  // already excluded from the ambiguity check above, and classifying '' would
  // dereference `new URL('https://', origin)` into a throw.
  return undefined;
}

export default resolveTarget;
