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

// type.isObject also accepts class instances, whose internals a copy would expose.
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function mapNode(value, key, visit, copies) {
  const visited = visit(value, key);
  if (visited !== value) return visited;
  if (!Array.isArray(value) && !isPlainObject(value)) return value;
  // Reusing the copy of an object already seen keeps shared references and cycles
  // intact instead of recursing forever.
  if (copies.has(value)) return copies.get(value);
  if (Array.isArray(value)) {
    const mappedArray = [];
    copies.set(value, mappedArray);
    value.forEach((item) => {
      mappedArray.push(mapNode(item, undefined, visit, copies));
    });
    return mappedArray;
  }
  const mappedObject = {};
  copies.set(value, mappedObject);
  Object.entries(value).forEach(([entryKey, item]) => {
    mappedObject[entryKey] = mapNode(item, entryKey, visit, copies);
  });
  return mappedObject;
}

// Copies the plain objects and arrays in a value, calling visit(value, key) on every
// node first - key is the object key, undefined for the root and array items. A
// different return replaces the node; the same value is kept, and descended into
// when it is a plain object or array. Class instances, Dates and Errors are kept
// by reference. The input is never mutated.
function mapPlainValues(value, visit) {
  return mapNode(value, undefined, visit, new Map());
}

export default mapPlainValues;
