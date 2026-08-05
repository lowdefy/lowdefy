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

// Plain objects and arrays are the config data model and are always copied; every other value is
// an opaque leaf, shared by reference. This restores what lodash.merge provided - it cloned
// plain-object and array source values into the destination while aliasing everything else. The
// split is not "is it a class instance" but type.isObject's own boundary: kindOf sorts a value as
// a plain object whenever it fails every built-in check and its Symbol.toStringTag tail check
// reads '[object Object]'. Date, RegExp, Map, Set, Error, Promise, typed arrays, Buffer, URL and
// any class that sets Symbol.toStringTag are shared by reference; a plain user class is not - it
// has no such tag, so it is copied and flattened into a bare object, losing its prototype.
//
// clone only walks Object.keys/array indices, so it carries own enumerable string keys forward
// and drops everything else: non-enumerable markers such as the build's `~k`/`~r`/`~l` keys, and
// symbol keys. Nothing merges those markers today, but a future caller that does would lose them
// silently. clone also always produces an object with Object.prototype, so a null-prototype
// object (e.g. Object.create(null), used deliberately for pollution hardening) loses that
// hardening if it passes through a merge; nothing does today.
function clone(value) {
  if (type.isArray(value)) {
    return value.map(clone);
  }
  if (!type.isObject(value)) {
    return value;
  }
  const result = {};
  for (const key of Object.keys(value)) {
    if (isReserved(key)) continue;
    result[key] = clone(value[key]);
  }
  return result;
}

function deepMerge(target, source) {
  const result = {};
  for (const key of Object.keys(target)) {
    if (isReserved(key)) continue;
    result[key] = clone(target[key]);
  }
  for (const key of Object.keys(source)) {
    // Value-side pollution guard. The reserved name arrives as data inside a merged value,
    // not as a path a developer typed, so dropping it misroutes nothing — skip, don't throw.
    if (isReserved(key)) continue;
    if (type.isObject(result[key]) && type.isObject(source[key])) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      // Everything that is not a plain object is a leaf, arrays included: a later array
      // replaces an earlier one rather than index-merging into it.
      result[key] = clone(source[key]);
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
