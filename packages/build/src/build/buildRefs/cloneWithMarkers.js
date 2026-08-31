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

import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

// THE deep clone for config subtrees inside buildRefs — preserves the
// non-enumerable provenance markers (~r ~l ~c ~x ~k ~arr), and with assignRefId set
// stamps ~r on nodes that have none (pass nothing to preserve the template's
// existing markers only). Non-plain values (Date) pass by reference; nothing
// in the build mutates them.
//
// Do not use serializer.copy on config subtrees in buildRefs: it round-trips
// the same markers but pays a JSON round-trip and re-instantiates Dates — the
// serializer is the artifact boundary, this is the in-memory clone.
function cloneWithMarkers(value, { assignRefId = null } = {}) {
  if (!type.isObject(value) && !type.isArray(value)) return value;
  let clone;
  if (type.isArray(value)) {
    clone = value.map((item) => cloneWithMarkers(item, { assignRefId }));
  } else {
    clone = {};
    for (const key of Object.keys(value)) {
      clone[key] = cloneWithMarkers(value[key], { assignRefId });
    }
  }
  if (value['~r'] !== undefined) {
    setNonEnumerableProperty(clone, '~r', value['~r']);
  } else if (assignRefId) {
    setNonEnumerableProperty(clone, '~r', assignRefId);
  }
  for (const marker of ['~l', '~c', '~x', '~k', '~arr']) {
    if (value[marker] !== undefined) {
      setNonEnumerableProperty(clone, marker, value[marker]);
    }
  }
  return clone;
}

export default cloneWithMarkers;
