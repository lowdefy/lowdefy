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

import parsePathPattern from './parsePathPattern.js';
import type from './type.js';

// The URL path of a page, with no leading "/" and no basePath.
function buildPagePath({ pageId, path, pathParams }) {
  if (type.isUndefined(path)) {
    return pageId;
  }
  const values = pathParams ?? {};
  return parsePathPattern(path)
    .map((segment) => {
      if (type.isString(segment.fixed)) {
        return segment.fixed;
      }
      const value = values[segment.name];
      if (type.isNone(value) || value === '') {
        throw new Error(
          `Link to page "${pageId}" is missing a value for path placeholder "${segment.name}".`
        );
      }
      const text = String(value);
      // The URL parser removes a "." or ".." segment, in any encoding, before the request is sent.
      if (text === '.' || text === '..') {
        throw new Error(
          `Link to page "${pageId}" has the value "${text}" for path placeholder "${segment.name}". A path value cannot be "." or "..".`
        );
      }
      return encodeURIComponent(text);
    })
    .join('/');
}

export default buildPagePath;
