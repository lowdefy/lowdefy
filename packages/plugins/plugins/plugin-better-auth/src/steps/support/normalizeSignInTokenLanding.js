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

import { buildPagePath, type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

// "/tasks/1" is a path in this app. "//host" and "/\host" start with a slash
// too, but a browser reads both as another host. Whitespace and control
// characters are refused outright: the URL parser drops some of them, so
// "/\t/host" would read as another host as well.
const appPathPattern = /^\/(?![/\\])/;
const whitespaceOrControlPattern = /[\s\p{Cc}]/u;

function assertAppPath({ url }) {
  if (!type.isString(url) || !appPathPattern.test(url) || whitespaceOrControlPattern.test(url)) {
    throw new Error(
      `CreateSignInToken "landing.url" must be a path in this app, starting with a single "/". Received ${JSON.stringify(
        url
      )}.`
    );
  }
}

// The landing a sign-in token is bound to: the one place its exchange lands,
// stored as a path in this app ({ url }) - never another site, so a sign-in
// link can not double as an open redirect. A page landing ({ pageId,
// urlQuery?, pathParams? }) is built into its path here, from the build's
// route table: the landing page that runs the exchange is public, and the
// browser there knows no path of a page the anonymous visitor may not see.
function normalizeSignInTokenLanding({ landing, routes }) {
  if (!type.isObject(landing)) {
    throw new Error(
      `CreateSignInToken requires a "landing" object - { pageId, urlQuery?, pathParams? } or { url }. Received ${JSON.stringify(
        landing
      )}.`
    );
  }
  const { pageId, url, urlQuery, pathParams } = landing;
  if (!type.isNone(pageId) && !type.isNone(url)) {
    throw new Error('CreateSignInToken "landing" takes "pageId" or "url", not both.');
  }
  if (!type.isNone(url)) {
    assertAppPath({ url });
    return { url };
  }
  if (!type.isString(pageId) || pageId === '') {
    throw new Error('CreateSignInToken "landing" requires a non-empty string "pageId" or "url".');
  }
  ['urlQuery', 'pathParams'].forEach((name) => {
    if (!type.isNone(landing[name]) && !type.isObject(landing[name])) {
      throw new Error(
        `CreateSignInToken "landing.${name}" must be an object. Received ${JSON.stringify(
          landing[name]
        )}.`
      );
    }
  });
  const route = (routes ?? []).find((candidate) => candidate.pageId === pageId);
  if (type.isNone(route)) {
    throw new Error(`CreateSignInToken "landing.pageId" "${pageId}" is not a page in this app.`);
  }
  const pagePath = buildPagePath({ pageId, path: route.path, pathParams });
  const query = urlQueryFn.stringify(urlQuery ?? {});
  const built = `/${pagePath}${query === '' ? '' : `?${query}`}`;
  assertAppPath({ url: built });
  return { url: built };
}

export default normalizeSignInTokenLanding;
