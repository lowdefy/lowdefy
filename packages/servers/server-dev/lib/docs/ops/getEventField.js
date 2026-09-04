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

// A wide event reaches us either nested (pino writes `error: { name }`) or
// already flattened by the sink ('error.name' as a literal key), depending on
// which sink and which OTLP exporter wrote it. Both spellings resolve to the
// same field so nothing above this has to know which one it got.
function getEventField(row, field) {
  if (type.isNone(row)) {
    return null;
  }
  if (!type.isUndefined(row[field])) {
    return row[field];
  }
  return get(row, field, { default: null });
}

export default getEventField;
