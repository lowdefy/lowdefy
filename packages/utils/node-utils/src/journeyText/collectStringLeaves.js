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

// Build markers: their values are key and reference ids, not text the app
// shows. `~arr` wraps an array that kept its markers, so its items are walked.
const MARKER_KEYS = new Set(['~k', '~r', '~l', '~ignoreBuildChecks']);

// Adds every string leaf of value to texts, trimmed, with finite numbers as
// their decimal text (a grid shows a fixture's 42 as "42"). Object keys are
// not leaves.
function collectStringLeaves({ value, texts }) {
  if (type.isString(value)) {
    const text = value.trim();
    if (text !== '') texts.add(text);
    return texts;
  }
  if (type.isNumber(value)) {
    texts.add(String(value));
    return texts;
  }
  if (type.isArray(value)) {
    value.forEach((item) => collectStringLeaves({ value: item, texts }));
    return texts;
  }
  if (type.isObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (MARKER_KEYS.has(key)) return;
      collectStringLeaves({ value: item, texts });
    });
  }
  return texts;
}

export default collectStringLeaves;
