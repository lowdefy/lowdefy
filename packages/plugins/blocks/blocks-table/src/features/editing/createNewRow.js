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

import { serializer, set, type, unset } from '@lowdefy/helpers';

// A row for "+ Add row": `fields` holds each column's `default` at its field. The row always gets
// a generated temporary key, kept out of `fields` so the server assigns the real one (the table
// shows the temporary key until then). A default on the key column is ignored: every added row
// would share it, and changes are recorded by key.
function createNewRow({ specs, keyField, generateKey }) {
  const fields = {};
  specs.forEach((spec) => {
    if (type.isUndefined(spec.default)) return;
    set(fields, spec.field, serializer.copy(spec.default));
  });
  unset(fields, keyField);
  return { rowKey: generateKey(), fields };
}

export default createNewRow;
