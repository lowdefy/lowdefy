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

function holds({ condition, collapsed }) {
  const isCollapsed = collapsed.has(condition.group);
  return condition.showWhen === 'closed' ? isCollapsed : !isCollapsed;
}

// The column visibility the table displays: the view's (`columnVisibility`, what the user hid)
// with the columns their column groups' state hides (getColumnGroupRules) turned off too. The
// view's visibility is returned as it is when no group can hide a column, so a table without
// collapsible groups keeps one visibility object.
function getDisplayedVisibility({ columnVisibility, collapsedColumnGroups, conditionsByKey }) {
  if (conditionsByKey.size === 0) return columnVisibility;
  const collapsed = new Set(collapsedColumnGroups);
  const displayed = { ...columnVisibility };
  conditionsByKey.forEach((conditions, key) => {
    if (!conditions.every((condition) => holds({ condition, collapsed }))) displayed[key] = false;
  });
  return displayed;
}

export default getDisplayedVisibility;
