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

function serializeQuery(query) {
  if (type.isNone(query) || query === '') {
    return '';
  }
  if (type.isString(query)) {
    return query;
  }
  return new URLSearchParams(query).toString();
}

function createUrl({ basePath = '', pathname, query }) {
  const serializedQuery = serializeQuery(query);
  return `${basePath}${pathname}${serializedQuery ? `?${serializedQuery}` : ''}`;
}

function parsePageId(url, basePath = '') {
  const pathname = new URL(url, 'http://localhost').pathname;
  const stripped =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const pageId = stripped.replace(/^\//, '').replace(/\/$/, '');
  return pageId === '' ? null : pageId;
}

export { createUrl, parsePageId, serializeQuery };
