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

import { serializer, set } from '@lowdefy/helpers';

import generateRowKey from '../editing/generateRowKey.js';
import triggerEnrichmentEvent from './triggerEnrichmentEvent.js';

// Action `addNewRow({ values })`: "+ New row" on Table. The row shows at once at the end of the
// table, marked saving, under a key made here, while onRowAdd `{ rowKey, values }` runs. The key
// is sent so the app can save the row under it: the saved row can reach the app's data (pushed
// live, or refetched) before the event settles, and with the same key the saving row hands over
// to it the moment it does (useEnrichmentRows) instead of both showing until the event settles.
// Either way the saving row leaves when the event settles, so it never outlives a failure, or an
// app that keys the row itself. Resolves with the error message, or null.
function createAddRow(api) {
  return async function addNewRow({ values }) {
    const rowKey = generateRowKey();
    const row = serializer.copy(values);
    set(row, api.properties.rowKey ?? '_id', rowKey);
    const { setPending } = api.enrichment;
    setPending((pending) => [...pending, row]);
    try {
      return await triggerEnrichmentEvent({ api, name: 'onRowAdd', event: { rowKey, values } });
    } finally {
      setPending((pending) => pending.filter((entry) => entry !== row));
    }
  };
}

export default createAddRow;
