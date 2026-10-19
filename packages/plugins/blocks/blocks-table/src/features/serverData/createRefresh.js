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

// Block method `refresh()`: in server mode, purges the block cache and refetches the visible
// blocks (rows stay on screen until they land). In client mode `data` is the app's, so there is
// nothing to refetch.
function createRefresh(api) {
  return function refresh() {
    api.serverStore?.refresh();
  };
}

export default createRefresh;
