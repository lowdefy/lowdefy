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

const EMPTY = [];

// The rows a table shows while it loads. `_request` returns null during a refetch (unless the
// Request action sets `holdValue`), so a table that shows `data` as it is flashes empty on every
// refetch. While `loading` is true and `data` has no rows, the last rows stay (`held`); once
// loading ends, `data` is the answer, empty or not. Returns `{ rows, held }`, `held` being what
// to keep for the next call.
function holdRows({ data, loading, held }) {
  const rows = type.isArray(data) ? data : EMPTY;
  if (loading === true && rows.length === 0 && type.isArray(held) && held.length > 0) {
    return { rows: held, held };
  }
  return { rows, held: rows };
}

export default holdRows;
