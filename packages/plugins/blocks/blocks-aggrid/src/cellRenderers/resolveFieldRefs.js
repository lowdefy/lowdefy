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

function resolvePath(path, data) {
  if (type.isNone(path)) return undefined;
  if (!type.isString(path)) return path;
  return get(data, path);
}

function resolveUrlQuery(urlQuery, data) {
  if (!type.isObject(urlQuery)) return undefined;
  const resolved = {};
  Object.keys(urlQuery).forEach((key) => {
    resolved[key] = resolvePath(urlQuery[key], data);
  });
  return resolved;
}

function resolveLink(link, data) {
  if (!type.isObject(link)) return undefined;
  return {
    pageId: link.pageId,
    href: link.href,
    back: link.back,
    home: link.home,
    newTab: link.newTab,
    urlQuery: resolveUrlQuery(link.urlQuery, data),
  };
}

export { resolvePath, resolveUrlQuery, resolveLink };
