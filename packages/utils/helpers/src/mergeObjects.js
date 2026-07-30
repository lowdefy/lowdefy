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

// Imported from the source module, not index.js, to avoid a circular import.
import { isReserved } from './ReservedKeyError.js';
import type from './type.js';

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    // Value-side pollution guard. The reserved name arrives as data inside a merged value,
    // not as a path a developer typed, so dropping it misroutes nothing — skip, don't throw.
    if (isReserved(key)) continue;
    if (type.isObject(result[key]) && type.isObject(source[key])) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      // Everything that is not a plain object is a leaf, arrays included: a later array
      // replaces an earlier one rather than index-merging into it.
      result[key] = source[key];
    }
  }
  return result;
}

function mergeObjects(objects) {
  if (type.isArray(objects)) {
    return objects
      .filter((obj) => type.isObject(obj))
      .reduce((merged, obj) => deepMerge(merged, obj), {});
  }
  return objects;
}

export default mergeObjects;
