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

function isMissing(value) {
  return type.isNone(value) || value === '';
}

// The inputs an enrichment or ai cell computes from, resolved from its row the way the server
// resolves them: `{ [param]: value }` for each of the column's `inputs`. A `{ column }` input is
// that column's value (an enrichment or ai column's only once its cell is `ok`), left out when it
// is missing (null, undefined or ''); a `{ value }` input is the literal as given. This object is
// what hashEnrichmentInputs hashes into `inputHash`. `column` must come from normalizeColumns
// (its `inputSources` are linked there).
function resolveEnrichmentInputs({ column, row }) {
  const inputs = {};
  (column.inputSources ?? []).forEach((source) => {
    if (!source.read) {
      inputs[source.param] = source.value;
      return;
    }
    const value = source.read(row);
    if (!isMissing(value)) inputs[source.param] = value;
  });
  return inputs;
}

export default resolveEnrichmentInputs;
