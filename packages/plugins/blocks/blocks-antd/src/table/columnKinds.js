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

// Enrichment table column kinds (Table only) and the column keys each kind takes. `input`
// columns are typed by users; the others compute their value: `formula` in the browser from a
// template, `enrichment` and `ai` on the server per row, `extract` in the browser from another
// column's raw result. An ai column lists the columns its prompt references in `inputs`: the
// server renders the prompt from those, it never parses the prompt for them.
const COLUMN_KINDS = {
  input: [],
  formula: ['template'],
  enrichment: ['provider', 'inputs', 'output', 'autoRun'],
  ai: ['prompt', 'inputs', 'output', 'autoRun'],
  extract: ['source', 'path'],
};

export default COLUMN_KINDS;
