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

import type from './type.js';

// The page id character set without "/", which separates segments.
const fixedSegmentPattern = /^[A-Za-z0-9\-_:]+$/;
const placeholderNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

function parsePlaceholder({ path, segment }) {
  const name = segment.slice(1, -1);
  if (name.startsWith('...')) {
    throw new Error(
      `Page path "${path}" has a catch-all placeholder "${segment}". Catch-all placeholders are not supported.`
    );
  }
  if (name.startsWith('?') || name.endsWith('?')) {
    throw new Error(
      `Page path "${path}" has an optional placeholder "${segment}". Optional placeholders are not supported.`
    );
  }
  if (!placeholderNamePattern.test(name)) {
    throw new Error(
      `Page path "${path}" has an invalid placeholder "${segment}". Placeholder names must start with a letter or "_" and only contain A-Z, a-z, 0-9 and "_".`
    );
  }
  return { name };
}

function parseSegment({ path, segment }) {
  if (segment === '') {
    throw new Error(`Page path "${path}" has an empty segment.`);
  }
  if (segment.startsWith('{') && segment.endsWith('}')) {
    return parsePlaceholder({ path, segment });
  }
  if (segment.includes('{') || segment.includes('}')) {
    throw new Error(
      `Page path "${path}" has a placeholder inside segment "${segment}". A placeholder must be a whole segment, like "{id}".`
    );
  }
  if (!fixedSegmentPattern.test(segment)) {
    throw new Error(
      `Page path "${path}" segment "${segment}" contains invalid characters. Fixed segments must only contain A-Z, a-z, 0-9, "-", "_" and ":".`
    );
  }
  return { fixed: segment };
}

function parseSegments(path) {
  if (path.startsWith('/') || path.endsWith('/')) {
    throw new Error(`Page path "${path}" must not start or end with "/".`);
  }
  const names = new Set();
  return path.split('/').map((segment) => {
    const parsed = parseSegment({ path, segment });
    if (type.isString(parsed.name)) {
      if (names.has(parsed.name)) {
        throw new Error(`Page path "${path}" uses placeholder "${segment}" more than once.`);
      }
      names.add(parsed.name);
    }
    return Object.freeze(parsed);
  });
}

// Patterns come from build config, so the cache holds at most one entry per page path.
const cache = new Map();

// Splits a page path pattern into segments, each { fixed } or { name }. The result is shared
// between callers and frozen.
function parsePathPattern(path) {
  if (!type.isString(path)) {
    throw new Error(`Page path must be a string. Received ${JSON.stringify(path)}.`);
  }
  if (cache.has(path)) {
    return cache.get(path);
  }
  const segments = Object.freeze(parseSegments(path));
  cache.set(path, segments);
  return segments;
}

export default parsePathPattern;
