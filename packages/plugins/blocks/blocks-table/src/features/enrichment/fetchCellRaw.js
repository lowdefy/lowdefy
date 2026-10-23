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

// The `__tableCellRaw` event result: the CallAPI action's routine response, `{ raw }`. Returns
// `{ raw }` (null when the cell kept none), or `{ error }` when the call failed or answered
// something else.
export function readCellRawResult(result) {
  if (result?.success === false) return { error: 'The raw result could not be loaded.' };
  const response = result?.responses?.__tableCellRaw?.response?.response;
  if (!type.isObject(response) || !Object.hasOwn(response, 'raw')) {
    return { error: 'The raw result could not be loaded.' };
  }
  return { raw: response.raw ?? null };
}

// Loads one cell's raw result from the table's `rawEndpoint`, for rows that carry their cells'
// state without it: a CallAPI action with `{ rowKey, key }` (the row's key and the column key) as
// its payload. Its error message is off: the details panel says the load failed.
async function fetchCellRaw({ api, endpoint, rowKey, key }) {
  api.methods.registerEvent({
    name: '__tableCellRaw',
    actions: [
      {
        id: '__tableCellRaw',
        type: 'CallAPI',
        params: { endpointId: endpoint, payload: { _event: true } },
        messages: { error: false },
      },
    ],
  });
  try {
    const result = await api.methods.triggerEvent({
      name: '__tableCellRaw',
      event: { rowKey, key },
    });
    return readCellRawResult(result);
  } catch {
    return { error: 'The raw result could not be loaded.' };
  }
}

export default fetchCellRaw;
