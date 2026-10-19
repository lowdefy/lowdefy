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

import toGroupKeys from './toGroupKeys.js';

// Block method `setGroup(keys)`: group by these columns, outermost first. Accepts column keys or
// `[{ key }]`; an empty list (or null) removes the grouping.
function createSetGroup(api) {
  return function setGroup(group) {
    const keys = toGroupKeys(group);
    keys.forEach((key) => {
      const column = api.config.columnsByKey.get(key);
      if (!column) {
        throw new Error(`setGroup: Table has no column "${key}".`);
      }
      if (!column.groupable) {
        throw new Error(`setGroup: column "${key}" is not groupable. Set "groupable: true".`);
      }
    });
    return api.actions.setGroupKeys([...new Set(keys)]);
  };
}

export default createSetGroup;
