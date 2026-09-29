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

// The `except` keys of an `{ all: true, except }` selection: the rows the user cleared since
// selecting all (recorded by toggleRowSelected), including rows that are not loaded now (server
// mode evicts and reloads blocks), plus exceptions the value set from outside.
function getSelectAllExcept({ api }) {
  return [...api.selectionExcept.values()];
}

export default getSelectAllExcept;
