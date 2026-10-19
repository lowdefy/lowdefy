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

// Enrichment and ai columns by the key of each enrichment column they require as an input: the
// cells that can wait for it (`waitingFor`), so its completion releases them.
function getDependentColumns(columnDefsByKey) {
  const dependents = new Map();
  columnDefsByKey.forEach((columnDef) => {
    if (!columnDef.runnable) return;
    columnDef.inputs.forEach((input) => {
      if (input.column === undefined || !input.required) return;
      if (columnDefsByKey.get(input.column)?.runnable !== true) return;
      const keys = dependents.get(input.column) ?? [];
      if (!keys.includes(columnDef.key)) keys.push(columnDef.key);
      dependents.set(input.column, keys);
    });
  });
  return dependents;
}

export default getDependentColumns;
