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

import { get, type } from '@lowdefy/helpers';

// Each string value read from the row as a field path (the ag-grid link cell
// convention), other values as written.
function resolveRowPaths({ paths, row }) {
  const resolved = {};
  Object.keys(paths).forEach((key) => {
    const path = paths[key];
    resolved[key] = type.isString(path) ? get(row, path) : path;
  });
  return resolved;
}

// A Link config for one row: `pageId`, `href`, `home`, `back`, `newTab` and
// `input` as written, and each `urlQuery` and `pathParams` value read from the
// row as a field path.
function resolveLink({ link, row }) {
  if (!type.isObject(link)) return undefined;
  const resolved = {
    pageId: link.pageId,
    href: link.href,
    home: link.home,
    back: link.back,
    newTab: link.newTab,
    input: link.input,
  };
  if (type.isObject(link.urlQuery)) {
    resolved.urlQuery = resolveRowPaths({ paths: link.urlQuery, row });
  }
  if (type.isObject(link.pathParams)) {
    resolved.pathParams = resolveRowPaths({ paths: link.pathParams, row });
  }
  return resolved;
}

export default resolveLink;
