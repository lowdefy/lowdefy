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

import { useMemo, useState } from 'react';

import createEnrichmentState from './createEnrichmentState.js';
import getSavingRows from './getSavingRows.js';

const EMPTY = [];

// Data pipeline stage 3: rows added with "+ New row" show at the end while onRowAdd runs
// (optimistic, marked `data-saving` through `api.savingRows`). One leaves as soon as the data has
// a row with its key (the app saved it under the `rowKey` the event sent), or else when the
// event settles: on success the app's data holds the row, on failure the editor shows the error.
// Returns the input rows while nothing is saving.
function useEnrichmentRows({ api, config, rows }) {
  if (!api.enrichment) api.enrichment = createEnrichmentState();
  const [pending, setPending] = useState(EMPTY);
  api.enrichment.setPending = setPending;
  const saving = useMemo(
    () => getSavingRows({ getKey: config.getKey, pending, rows }),
    [config.getKey, pending, rows]
  );
  api.savingRows = useMemo(() => (saving.length === 0 ? null : new Set(saving)), [saving]);
  return useMemo(() => (saving.length === 0 ? rows : [...rows, ...saving]), [rows, saving]);
}

export default useEnrichmentRows;
