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

import { parsePathPattern, type } from '@lowdefy/helpers';

// readConfigFile returns the same cached routes array per server lifetime, so
// the table is grouped by segment count once.
const tables = new WeakMap();

function getRouteTable(routes) {
  if (tables.has(routes)) {
    return tables.get(routes);
  }
  const table = new Map();
  routes.forEach(({ pageId, path }) => {
    const segments = parsePathPattern(path);
    if (!table.has(segments.length)) {
      table.set(segments.length, []);
    }
    table.get(segments.length).push({ pageId, segments });
  });
  tables.set(routes, table);
  return table;
}

// The decoded segments of a request path, or null when one is empty, fails to
// decode or is a dot segment. Browsers remove "." and ".." segments before a
// request is sent, and the path builder refuses those values, so only a
// hand-made request carries one.
function decodeSegments(path) {
  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
  const decoded = [];
  for (const segment of trimmed.split('/')) {
    if (segment === '') {
      return null;
    }
    let value;
    try {
      value = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (value === '.' || value === '..') {
      return null;
    }
    decoded.push(value);
  }
  return decoded;
}

function segmentMatches({ segment, value }) {
  return !type.isString(segment.fixed) || segment.fixed === value;
}

// Matches a request path (basePath and the leading "/" removed) to a page.
// Walking left to right, at the first position where the candidates differ a
// fixed segment beats a placeholder. The build refuses ties, so at most one
// candidate is left. Returns { pageId, pathParams } or null.
function matchPagePath({ routes, path }) {
  const values = decodeSegments(path);
  if (values === null) {
    return null;
  }
  let candidates = (getRouteTable(routes).get(values.length) ?? []).filter(({ segments }) =>
    segments.every((segment, i) => segmentMatches({ segment, value: values[i] }))
  );
  for (let i = 0; i < values.length && candidates.length > 1; i += 1) {
    const fixed = candidates.filter(({ segments }) => type.isString(segments[i].fixed));
    if (fixed.length > 0) {
      candidates = fixed;
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  const [{ pageId, segments }] = candidates;
  const pathParams = {};
  segments.forEach((segment, i) => {
    if (type.isString(segment.name)) {
      pathParams[segment.name] = values[i];
    }
  });
  return { pageId, pathParams };
}

export default matchPagePath;
