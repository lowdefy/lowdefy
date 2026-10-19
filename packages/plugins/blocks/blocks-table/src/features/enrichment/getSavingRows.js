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

// The optimistic new rows to show: those whose key no row of the data has yet. An app that saves
// a new row under the key onRowAdd sent can have it in its data before the event settles (a live
// push, a refetch), and the saved row must replace the saving one then, not show beside it.
// Returns `pending` itself when every row is still saving, so memos on it stay warm.
function getSavingRows({ getKey, pending, rows }) {
  if (pending.length === 0) return pending;
  const pendingKeys = new Set(pending.map((row) => String(getKey(row))));
  const savedKeys = new Set();
  rows.forEach((row) => {
    const key = String(getKey(row));
    if (pendingKeys.has(key)) savedKeys.add(key);
  });
  if (savedKeys.size === 0) return pending;
  return pending.filter((row) => !savedKeys.has(String(getKey(row))));
}

export default getSavingRows;
