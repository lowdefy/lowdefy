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

import { TIMESTAMP_PATTERN, UUID_PATTERN } from './normalizeDom.js';

function normalizeValue(value) {
  if (type.isString(value)) {
    return value.replace(TIMESTAMP_PATTERN, '[TS]').replace(UUID_PATTERN, '[UUID]');
  }
  if (type.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (type.isObject(value)) {
    return Object.keys(value).reduce((normalized, key) => {
      normalized[key] = normalizeValue(value[key]);
      return normalized;
    }, {});
  }
  return value;
}

// normalizeState applies to state.json the same replacements normalizeDom
// applies to dom.html: a value set from the clock or a generated id moves
// between two renders of unchanged config and would otherwise drift every run.
// Keys are left alone — a key is config, not a captured value — so ignoring a
// path stays the exception rather than the rule.
function normalizeState({ state }) {
  return normalizeValue(state ?? {});
}

export default normalizeState;
