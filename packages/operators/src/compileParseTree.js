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

// Markers the serializer keeps, hidden, on its copies (makeReplacer/makeReviver).
const MARKERS = ['~r', '~k', '~l'];
// Keys the serializer's reviver turns into something else (Dates, Errors, arrays).
const REVIVED_KEYS = new Set(['~d', '~e', '~arr']);

// Thrown while compiling a value the JSON round trip treats specially. The whole
// root then stays on the walker, so the fallback is exact, never approximate.
class Uncompilable extends Error {}

function readMarkers(value) {
  return MARKERS.filter((marker) => value[marker]).map((marker) => [marker, value[marker]]);
}

function attachMarkers(target, markers) {
  markers.forEach(([marker, markerValue]) => {
    Object.defineProperty(target, marker, {
      value: markerValue,
      enumerable: false,
      writable: true,
      configurable: true,
    });
  });
}

function compileObject(value) {
  const keys = [];
  const children = [];
  Object.keys(value).forEach((key) => {
    if (REVIVED_KEYS.has(key)) {
      throw new Uncompilable();
    }
    if (MARKERS.includes(key)) {
      // An enumerable truthy marker comes back hidden; a falsy one comes back
      // enumerable (the serializer only moves truthy markers).
      if (!value[key]) {
        throw new Uncompilable();
      }
      return;
    }
    keys.push(key);
    // eslint-disable-next-line no-use-before-define
    children.push(compileNode(value[key]));
  });
  // The serializer's replacer shallow-copies an object with a Date property
  // before it reads markers, and the spread drops hidden ones: only enumerable
  // markers survive on such an object.
  const hasDateChild = Object.keys(value).some((key) => type.isDate(value[key]));
  const markers = hasDateChild
    ? readMarkers(value).filter(([marker]) => Object.keys(value).includes(marker))
    : readMarkers(value);
  return (evaluation) => {
    const output = {};
    let assigned = 0;
    let lastKey;
    for (let index = 0; index < keys.length; index += 1) {
      const child = children[index](evaluation);
      // JSON.parse deletes a property its reviver returns undefined for.
      if (child !== undefined) {
        assigned += 1;
        lastKey = keys[index];
        if (keys[index] === '__proto__') {
          // JSON.parse defines an own "__proto__" property; assignment would set the prototype.
          Object.defineProperty(output, '__proto__', {
            value: child,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        } else {
          output[keys[index]] = child;
        }
      }
    }
    attachMarkers(output, markers);
    // Only an object left with exactly one key can be an operator (the
    // reviver's Object.keys(value).length test, counted as it was built).
    if (assigned !== 1) {
      return output;
    }
    return evaluation.reviveKey(output, lastKey);
  };
}

function compileArray(value) {
  for (let index = 0; index < value.length; index += 1) {
    if (!(index in value)) {
      throw new Uncompilable();
    }
  }
  const children = value.map((item) => compileNode(item));
  const markers = readMarkers(value);
  return (evaluation) => {
    const output = new Array(children.length);
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index](evaluation);
      // JSON.parse deletes an element its reviver returns undefined for, leaving a hole.
      if (child !== undefined) {
        output[index] = child;
      }
    }
    attachMarkers(output, markers);
    return output;
  };
}

function compileNode(value) {
  if (value === null || type.isString(value) || type.isBoolean(value)) {
    return () => value;
  }
  // type.isNumber excludes NaN and Infinity, which JSON turns into null.
  if (type.isNumber(value)) {
    // JSON has no -0.
    const number = value === 0 ? 0 : value;
    return () => number;
  }
  if (type.isDate(value)) {
    const time = value.getTime();
    return () => new Date(time);
  }
  if (type.isArray(value)) {
    return compileArray(value);
  }
  if (type.isObject(value) && !type.isFunction(value.toJSON)) {
    return compileObject(value);
  }
  throw new Uncompilable();
}

// Compiles a config tree into closures that return exactly what
// serializer.copy(input, { reviver }) returns: a fresh tree, post-order, keys in
// Object.keys order, undefined results deleted (objects) or left as holes
// (arrays), hidden markers kept, and every assembled single-key object passed to
// evaluation.reviveKey - the same operator test the walker's reviver runs. Returns
// null when the tree holds a value the JSON round trip would change.
function compileParseTree(input) {
  try {
    return compileNode(input);
  } catch (error) {
    if (error instanceof Uncompilable) {
      return null;
    }
    throw error;
  }
}

export default compileParseTree;
