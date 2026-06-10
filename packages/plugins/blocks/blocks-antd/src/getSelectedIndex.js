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

import serializeSelectorValue from './serializeSelectorValue.js';

// Maps the current block value to the index (or indices) of the matching entry built by
// getSelectorOptions. Matching is by identity: when `primaryKey` names a field, that field is
// projected from both the stored value and each entry's value before comparison; with no
// `primaryKey` the whole value is compared (the original `value` behaviour, which also matches
// object-valued options). `valueKey` is only a build-time extraction key in getSelectorOptions —
// by match time the stored value is already the unwrapped entry value, so it must not drive
// identity here (reusing it projected a missing `.value` off the bare value and broke matching).
const serialize = serializeSelectorValue;

const getSelectedIndex = (value, entries, { properties = {}, multiple } = {}) => {
  const { primaryKey } = properties;
  const project = (val) =>
    type.isString(primaryKey) && type.isObject(val) ? get(val, primaryKey) : val;
  const idOfValue = (v) => project(v);
  const idOfEntry = (entry) => project(type.isPrimitive(entry) ? entry : entry.value);

  const findIndex = (v) => {
    const target = serialize(idOfValue(v));
    for (let i = 0; i < entries.length; i += 1) {
      if (serialize(idOfEntry(entries[i])) === target) return `${i}`;
    }
    return undefined;
  };

  if (multiple) {
    return (type.isArray(value) ? value : []).map((v) => findIndex(v));
  }
  return findIndex(value);
};

export default getSelectedIndex;
