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

import toAuthoredConfig from './toAuthoredConfig.js';

// Keys the build adds to a request that no author writes: the page's auth
// projected onto the request, and the ids the build split out of the prefixed
// request id. Writing them back would fail the request schema.
const DERIVED_REQUEST_KEYS = ['auth', 'requestId', 'pageId'];

// Keys the build adds to a page that no author writes.
const DERIVED_PAGE_KEYS = ['dynamic'];

// The page root's `requests` in the built page is a trimmed index (id, payload)
// — the request configs themselves are written one file per request. The
// authored page carries the full config, keyed by the request id the author
// wrote, which is the artifact's file name.
function toAuthoredRequests(requests) {
  return requests.map(({ requestId, config }) => {
    const authoredConfig = toAuthoredConfig(config);
    const authored = { id: requestId };
    Object.keys(authoredConfig).forEach((key) => {
      if (key === 'id') return;
      if (DERIVED_REQUEST_KEYS.includes(key)) return;
      authored[key] = authoredConfig[key];
    });
    return authored;
  });
}

// Rebuilds the page config an author would have written from the build's page
// artifact and its request artifacts. This is what `lowdefy expand` writes back
// into the config directory in place of an archetype declaration.
function toAuthoredPage({ page, requests }) {
  const authored = toAuthoredConfig(page);
  DERIVED_PAGE_KEYS.forEach((key) => delete authored[key]);
  if (type.isArray(authored.subscriptions) && authored.subscriptions.length === 0) {
    delete authored.subscriptions;
  }
  if (type.isObject(authored.properties) && Object.keys(authored.properties).length === 0) {
    delete authored.properties;
  }
  if (requests.length === 0) {
    delete authored.requests;
    return authored;
  }
  authored.requests = toAuthoredRequests(requests);
  return authored;
}

export default toAuthoredPage;
