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

// A row added in TableInput: `{ rowKey, ...fields }` at the end of `added` (and of `order`, when a
// move recorded one).
function addChangeRow({ changes, rowKey, fields }) {
  const next = { ...changes, added: [...changes.added, { rowKey, ...fields }] };
  if (changes.order) next.order = [...changes.order, rowKey];
  return next;
}

export default addChangeRow;
