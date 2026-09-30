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
import hashEnrichmentInputs from '@lowdefy/blocks-antd/table/hashEnrichmentInputs.js';
import resolveEnrichmentInputs from '@lowdefy/blocks-antd/table/resolveEnrichmentInputs.js';

const STATUSES = new Set(['queued', 'running', 'ok', 'error', 'empty']);

// A cell's run state (design E6) from its row: `status` is the stored `_enrich.<key>.status`
// (queued, running, ok, error, empty), or `none` for a cell that never ran. A finished cell
// (`ok` or `empty`) is stale when its stored `inputHash` differs from the hash of the row's
// current inputs, computed with the server's own function (hashEnrichmentInputs). `state` is the
// stored object (value, raw, error, timings) or null.
function getRunState({ column, row }) {
  const state = get(row, column.stateField);
  if (!type.isObject(state) || !STATUSES.has(state.status)) {
    return { status: 'none', state: type.isObject(state) ? state : null, stale: false };
  }
  const finished = state.status === 'ok' || state.status === 'empty';
  const stale =
    finished &&
    type.isString(state.inputHash) &&
    type.isArray(column.inputSources) &&
    state.inputHash !== hashEnrichmentInputs(resolveEnrichmentInputs({ column, row }));
  return { status: state.status, state, stale };
}

export default getRunState;
