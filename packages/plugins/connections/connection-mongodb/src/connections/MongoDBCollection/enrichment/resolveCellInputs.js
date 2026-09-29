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

function isMissingValue(value) {
  return type.isNone(value) || value === '';
}

// The inputs of one cell, read from its row:
//   inputs:  { [param]: value }; an optional input with no value is left out.
//   missing: the first required input column with no value (null, missing or ''), or an
//            enrichment input whose cell finished without an ok value. The cell can not run.
//   waiting: a required enrichment input is queued or running, so the cell waits for it.
// The Table resolves inputs the same way in the browser, so the hashes agree.
function resolveCellInputs({ doc, sources }) {
  const inputs = {};
  let missing = null;
  let waiting = false;
  sources.forEach((source) => {
    if (source.source === 'value') {
      inputs[source.param] = source.value;
      return;
    }
    if (source.source === 'field') {
      const value = get(doc, source.path, { default: undefined });
      if (!isMissingValue(value)) {
        inputs[source.param] = value;
      } else if (source.required && missing === null) {
        missing = source.column;
      }
      return;
    }
    const status = get(doc, source.statusPath, { default: undefined });
    const value = get(doc, source.valuePath, { default: undefined });
    if (status === 'ok' && !isMissingValue(value)) {
      inputs[source.param] = value;
      return;
    }
    if (!source.required) return;
    if (status === 'queued' || status === 'running') {
      waiting = true;
    } else if (missing === null) {
      missing = source.column;
    }
  });
  return { inputs, missing, waiting: missing === null && waiting };
}

export default resolveCellInputs;
