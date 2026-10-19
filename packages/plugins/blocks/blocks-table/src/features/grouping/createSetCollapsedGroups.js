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

// Replaces the collapsed group keys. A no-op change never reaches updateSlice, whose pending
// cause would otherwise attach to the next unrelated state change.
function createSetCollapsedGroups(api) {
  return function setCollapsedGroups(keys) {
    const current = api.state.collapsedGroups;
    if (keys.length === current.length && keys.every((key, i) => key === current[i])) return false;
    api.updateSlice('collapsedGroups', () => keys, { cause: 'expand' });
    return true;
  };
}

export default createSetCollapsedGroups;
