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

import jsonType from './jsonType.js';
import toJsonSafe from './toJsonSafe.js';

// Objects are walked to their leaves so a write to one field of a form object
// reports that field's path; arrays are leaves, because a journey expectation
// on "rows.3.name" locks an ordering the app never promised.
// `seen` closes the cycle: page state is app data and an app is free to put a
// self-referencing object in it, which the walk would otherwise follow forever.
function collectLeaves({ into, path, seen = new WeakSet(), value }) {
  if (type.isObject(value) && Object.keys(value).length > 0 && !seen.has(value)) {
    seen.add(value);
    Object.keys(value).forEach((key) => {
      collectLeaves({ into, path: path === '' ? key : `${path}.${key}`, seen, value: value[key] });
    });
    return into;
  }
  into.set(path, value);
  return into;
}

function isSameValue(a, b) {
  if (type.isDate(a) && type.isDate(b)) {
    return a.getTime() === b.getTime();
  }
  try {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  } catch {
    // A value that cannot be serialized cannot be compared; report it as written.
    return false;
  }
}

// The paths an action chain wrote, as the difference between the state before
// the chain ran and the state after. `values` is the dev-only branch: in
// production the recorder never asks for it, so a value cannot reach the wire.
function diffStateWrites({ after, before, values = false }) {
  const beforeLeaves = collectLeaves({ into: new Map(), path: '', value: before ?? {} });
  const afterLeaves = collectLeaves({ into: new Map(), path: '', value: after ?? {} });
  const writes = [];

  afterLeaves.forEach((value, path) => {
    if (path === '') return;
    if (beforeLeaves.has(path) && isSameValue(beforeLeaves.get(path), value)) return;
    writes.push(
      values
        ? { path, type: jsonType(value), value: toJsonSafe(value) }
        : { path, type: jsonType(value) }
    );
  });

  beforeLeaves.forEach((_, path) => {
    if (path === '' || afterLeaves.has(path)) return;
    writes.push({ path, type: 'undefined' });
  });

  return writes;
}

export default diffStateWrites;
