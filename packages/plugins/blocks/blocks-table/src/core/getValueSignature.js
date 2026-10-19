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

// SetState on a path inside the value (`deals.view.sort`, `deals.selected`) mutates the object the
// table wrote, so identity alone cannot tell an external change from the table's own write. The
// view is small and compared by JSON; `selected` and `expanded` can be large and are compared by
// identity, which a SetState on them always changes.
function getValueSignature(value) {
  return {
    view: JSON.stringify(value?.view ?? null),
    selected: value?.selected,
    expanded: value?.expanded,
  };
}

export default getValueSignature;
