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

import { type } from '@lowdefy/helpers';

// "/tasks/1" is a path in this app. "//host" and "/\host" start with a slash
// too, but a browser reads both as another host. Whitespace and control
// characters are refused outright: the URL parser drops some of them, so
// "/\t/host" would read as another host as well.
const appPathPattern = /^\/(?![/\\])/;
const whitespaceOrControlPattern = /[\s\p{Cc}]/u;

// The landing a sign-in token is bound to: the one place its exchange lands.
// Either a page ({ pageId, urlQuery?, pathParams? }) or a path in this app
// ({ url }), never another site - a sign-in link must not double as an open
// redirect. Returns the landing with only the known keys, as stored.
function normalizeSignInTokenLanding({ landing }) {
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
    if (!type.isString(url) || !appPathPattern.test(url) || whitespaceOrControlPattern.test(url)) {
      throw new Error(
        `CreateSignInToken "landing.url" must be a path in this app, starting with a single "/". Received ${JSON.stringify(
          url
        )}.`
      );
    }
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
  const normalized = { pageId };
  if (!type.isNone(urlQuery)) {
    normalized.urlQuery = urlQuery;
  }
  if (!type.isNone(pathParams)) {
    normalized.pathParams = pathParams;
  }
  return normalized;
}

export default normalizeSignInTokenLanding;
