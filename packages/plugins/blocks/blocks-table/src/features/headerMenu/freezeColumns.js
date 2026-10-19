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

// "Freeze up to here" (Notion): the column and every visible column before it, in the order the
// table shows them, become the start-pinned region; later columns are unpinned from the start.
// Hidden start-pinned columns stay pinned, so showing one again brings it back where it was.
function freezeColumns({ pinning, visibleOrder, key }) {
  const index = visibleOrder.indexOf(key);
  const frozen = visibleOrder.slice(0, index + 1);
  const visible = new Set(visibleOrder);
  const frozenSet = new Set(frozen);
  return {
    start: [...pinning.start.filter((entry) => !visible.has(entry)), ...frozen],
    end: pinning.end.filter((entry) => !frozenSet.has(entry)),
  };
}

export default freezeColumns;
