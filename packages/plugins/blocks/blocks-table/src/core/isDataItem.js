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

// A display-list entry that is a data row: a TanStack row, or a wrapped row item (`kind: 'row'`,
// a tree row or an expandable row). Group headers, detail rows and the `undefined` holes of rows
// a server table has not loaded yet are not.
function isDataItem(item) {
  return item !== undefined && (item.kind ?? 'row') === 'row';
}

export default isDataItem;
