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

// The `__tableFetch` event result: the Request action's response for the table's request. The
// entries of a list are its groups at a group level and its rows at the leaf level.
function readFetchResult({ result, isGroupLevel }) {
  const response = result?.responses?.__tableFetch?.response?.[0];
  if (!type.isObject(response) || !type.isInt(response.total) || !type.isArray(response.rows)) {
    throw new Error(
      `Table server request must return { rows, total }. Received ${JSON.stringify(response)}.`
    );
  }
  let entries = response.rows;
  if (isGroupLevel) {
    if (!type.isArray(response.groups)) {
      throw new Error(
        `Table server request must return "groups" when the view is grouped. Received ${JSON.stringify(
          response
        )}.`
      );
    }
    entries = response.groups;
  }
  return { entries, total: response.total, aggregates: response.aggregates ?? null };
}

export default readFetchResult;
