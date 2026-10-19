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

// Data sets are plain YAML read by the dev server, not app config built by @lowdefy/build, so a
// _ref anywhere would silently stay an object instead of including the file it names.
function findRefPath({ value, path }) {
  if (type.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findRefPath({ value: value[index], path: `${path}[${index}]` });
      if (!type.isNone(found)) return found;
    }
    return null;
  }
  if (!type.isObject(value)) return null;
  if (Object.prototype.hasOwnProperty.call(value, '_ref')) return path;
  for (const key of Object.keys(value)) {
    const found = findRefPath({ value: value[key], path: path === '' ? key : `${path}.${key}` });
    if (!type.isNone(found)) return found;
  }
  return null;
}

export default findRefPath;
