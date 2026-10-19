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

// Features that take over the content of some data columns' cells, from their `cellRenderer`:
// `{ match(column), Cell }`. `Cell` receives `{ api, col, lead, original, rowKey }` (`lead`: the
// tree or expand chevron before the content in a row's first data cell) and renders the cells
// of every column `match` accepts (enrichment's computed and invalid columns); the first match
// wins, and other columns render through the shared cell core.
function collectCellRenderers(features) {
  return features.map((feature) => feature.cellRenderer).filter(Boolean);
}

export default collectCellRenderers;
