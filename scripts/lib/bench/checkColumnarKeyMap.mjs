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

import createColumnarKeyMap from '../../../packages/utils/errors/src/createColumnarKeyMap.js';
import createKeyPathResolver from '../../../packages/utils/errors/src/createKeyPathResolver.js';
import serializer from '../../../packages/utils/helpers/src/serializer.js';

// parentId is left out: a root's parent is never written, so the columns have
// none where keyMap.json names it.
const FIELDS = ['path', 'refId', 'line', 'ignoreBuildChecks'];

// keyMap.json.gz holds keyMap.json in columns (encodeColumnarKeyMap), so it
// cannot gunzip to it. It must resolve every key of keyMap.json to the same
// path, ref, line and ignored checks, read by this checkout's readers.
// keyMap.json is read with the serializer, as its build-folder readers read it:
// an `i` array from YAML is written with its ~arr markers, and the columns hold
// the array itself. Returns { identical, lines }, lines naming up to limit
// differing keys.
function checkColumnarKeyMap({ plainText, columnsText, limit = 20 }) {
  const keyMap = serializer.deserializeFromString(plainText);
  const fromPlain = createKeyPathResolver({ keyMap });
  const fromColumns = createKeyPathResolver({
    keyMap: createColumnarKeyMap(JSON.parse(columnsText)),
  });
  const lines = [];
  let differing = 0;
  for (const id of Object.keys(keyMap)) {
    const expected = fromPlain(id);
    const actual = fromColumns(id);
    const fields =
      actual === null
        ? ['(not in the columns)']
        : FIELDS.filter(
            (field) => JSON.stringify(expected[field]) !== JSON.stringify(actual[field])
          );
    if (fields.length === 0) continue;
    differing += 1;
    if (lines.length < limit) {
      lines.push(`${id}: ${fields.join(', ')} differs from keyMap.json`);
    }
  }
  if (differing > lines.length) {
    lines.push(`… and ${differing - lines.length} more keys that differ.`);
  }
  return { identical: differing === 0, lines };
}

export default checkColumnarKeyMap;
