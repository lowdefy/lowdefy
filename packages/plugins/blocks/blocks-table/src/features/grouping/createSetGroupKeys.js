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

// Sets the group levels (column keys, outermost first). Used by the setGroup method and the
// header menu; keys are validated by the caller.
function createSetGroupKeys(api) {
  return function setGroupKeys(keys) {
    const current = api.state.grouping;
    if (keys.length === current.length && keys.every((key, i) => key === current[i])) return false;
    api.updateSlice('grouping', () => keys, { cause: 'group' });
    return true;
  };
}

export default createSetGroupKeys;
