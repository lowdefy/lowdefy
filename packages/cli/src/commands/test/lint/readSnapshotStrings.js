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

import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

// Adds the string leaves of one canonical EJSON document. A key starting with
// `$` wraps a typed value (`$oid`, `$date`, `$numberInt`), never text someone
// would type, so its value is left out.
function collectStrings({ value, strings }) {
  if (type.isString(value)) {
    const text = value.trim();
    if (text !== '') strings.add(text);
    return;
  }
  if (type.isArray(value)) {
    value.forEach((item) => collectStrings({ value: item, strings }));
    return;
  }
  if (type.isObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (key.startsWith('$')) return;
      collectStrings({ value: item, strings });
    });
  }
}

// The strings in a data set's pulled snapshot, read from
// .lowdefy/data/<name>/<collection>.jsonl for each collection the manifest
// lists. Canonical EJSON is JSON, so each line is read with JSON.parse and the
// CLI needs no MongoDB driver. `manifest` is parseDataSet's `snapshot`.
function readSnapshotStrings({ configDirectory, name, manifest }) {
  const strings = new Set();
  const snapshotDirectory = path.join(configDirectory, '.lowdefy', 'data', name);
  Object.keys(manifest.collections ?? {}).forEach((collection) => {
    const filePath = path.join(snapshotDirectory, `${collection}.jsonl`);
    fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .forEach((line) => collectStrings({ value: JSON.parse(line), strings }));
  });
  return strings;
}

export default readSnapshotStrings;
