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

// The enrichment module's per-table state, on `api.enrichment`: the UI state (which overlay is
// open, the rename in progress, the notice) with its setter, the optimistic new rows with theirs,
// the raw column configs by key (event payloads carry the config as the app wrote it) and the run
// state counts of the header chips. The hooks refresh it every render.
function createEnrichmentState() {
  return {
    counts: new Map(),
    rawColumns: new Map(),
    setPending: null,
    setUi: null,
    ui: null,
  };
}

export default createEnrichmentState;
