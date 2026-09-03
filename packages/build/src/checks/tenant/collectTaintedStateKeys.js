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

// Which routine state keys carry caller-controlled data. On the server, state
// starts `{}` on every entry point and only a `:set_state` control writes it,
// so `_state.x` in a step is exactly as trustworthy as the value written to
// `x`: a literal, `_user`, `_step` or `_secret` write is server-authored and
// safe, and only a write that reaches the payload launders caller input into
// the state.
//
// Two writes taint a key:
// - the written value reads `_payload` at any depth, and
// - the written value is a `_js` body, whose source is whatever the evaluator
//   passes it - unknowable from the config.
// Everything else passes, deliberately: a check that flagged every `_state`
// read reported a leak that can not exist, hundreds of times, and taught
// readers to ignore tenant findings altogether.
//
// Keys are dotted paths (`set(state, key, value)`), so the root segment is the
// unit of taint: `_state.org.id` reads whatever wrote `org`.
const TAINTING_OPERATORS = ['_payload', '_js'];

function isTainted(value) {
  if (type.isArray(value)) {
    return value.some(isTainted);
  }
  if (!type.isObject(value)) return false;
  return Object.keys(value).some((key) => {
    if (TAINTING_OPERATORS.some((op) => key === op || key.startsWith(`${op}.`))) return true;
    return isTainted(value[key]);
  });
}

function walk(routine, tainted) {
  if (type.isArray(routine)) {
    routine.forEach((item) => walk(item, tainted));
    return;
  }
  if (!type.isObject(routine)) return;
  const setState = routine[':set_state'];
  if (type.isObject(setState)) {
    Object.entries(setState).forEach(([key, value]) => {
      if (isTainted(value)) tainted.add(key.split('.')[0]);
    });
  }
  Object.values(routine).forEach((value) => walk(value, tainted));
}

function collectTaintedStateKeys(routine) {
  const tainted = new Set();
  walk(routine, tainted);
  return tainted;
}

export default collectTaintedStateKeys;
