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

import buildPagePath from './buildPagePath.js';
import parsePathPattern from './parsePathPattern.js';
import type from './type.js';

// The key a page instance's context and input are stored under. A page with placeholders has one
// instance per set of decoded values, keyed by the path the builder writes for them, so every
// spelling of the same values in an arriving URL gives one key. "#" cannot appear in a page id and
// the builder encodes it in values, so no instance key equals another page's key.
function pageInstanceKey({ pageId, path, pathParams }) {
  if (type.isUndefined(path)) {
    return `page:${pageId}`;
  }
  const hasPlaceholders = parsePathPattern(path).some((segment) => type.isString(segment.name));
  if (!hasPlaceholders) {
    return `page:${pageId}`;
  }
  return `page:${pageId}#${buildPagePath({ pageId, path, pathParams })}`;
}

export default pageInstanceKey;
