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

// The target columns with every column before the targets that read it, so an enqueue plans a
// column's cells before the cells that wait for them. `columnDefs` has no input cycles.
function orderTargetsByInputs(targets) {
  const byKey = new Map(targets.map((target) => [target.key, target]));
  const ordered = [];
  const done = new Set();
  function visit(target) {
    if (done.has(target.key)) return;
    done.add(target.key);
    target.inputs.forEach((input) => {
      const upstream = byKey.get(input.column);
      if (upstream !== undefined) visit(upstream);
    });
    ordered.push(target);
  }
  targets.forEach(visit);
  return ordered;
}

export default orderTargetsByInputs;
