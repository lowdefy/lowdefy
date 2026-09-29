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

function fromEntry(entry) {
  if (type.isPrimitive(entry)) {
    return { value: entry, label: String(entry) };
  }
  return { ...entry, label: entry.label ?? String(entry.value) };
}

// Column options as [{ value, label, color, icon }]. Accepts the selector shape
// (an array of values or of { value, label, ... }) or a map keyed by value
// whose entries are either a label or { label, color, icon }. Map keys are
// strings, so map options match string values.
function normalizeOptions(options) {
  if (type.isNone(options)) return undefined;
  if (type.isArray(options)) {
    return options.map(fromEntry);
  }
  if (type.isObject(options)) {
    return Object.entries(options).map(([value, entry]) => {
      if (type.isObject(entry)) {
        return { ...entry, value, label: entry.label ?? value };
      }
      return { value, label: type.isNone(entry) ? value : String(entry) };
    });
  }
  throw new Error(
    `Table column options must be an array or an object. Received ${JSON.stringify(options)}.`
  );
}

export default normalizeOptions;
