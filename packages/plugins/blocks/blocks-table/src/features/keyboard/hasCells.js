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

// Whether display row `row` renders focusable cells. The header row always does. Body rows do not
// while the body shows the initial skeleton (api.loadingState), and neither do the items the body
// renders as a skeleton row (an unloaded server row, a lazy tree row's loading children) or as
// a server error row.
function hasCells({ api, row }) {
  if (row === -1) return true;
  if (api.loadingState === 'initial') return false;
  const item = api.rows[row];
  return item !== undefined && item.kind !== 'skeleton' && item.kind !== 'error';
}

export default hasCells;
