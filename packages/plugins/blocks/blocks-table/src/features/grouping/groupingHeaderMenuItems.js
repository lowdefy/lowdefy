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

// The header menu's grouping entries for a groupable column (collected by the headerMenu feature
// through its `headerMenuItems` extension point). "Group by this column" adds the column as the
// innermost level, so repeating it on other columns builds a multi-level grouping.
function groupingHeaderMenuItems({ column, api }) {
  if (api.config.columnsByKey.get(column.key)?.groupable !== true) return [];
  const keys = api.state.grouping;
  if (keys.includes(column.key)) {
    return [
      {
        key: 'grouping-remove',
        label: 'Remove grouping',
        onClick: () => api.actions.setGroupKeys(keys.filter((key) => key !== column.key)),
      },
    ];
  }
  return [
    {
      key: 'grouping-add',
      label: 'Group by this column',
      onClick: () => api.actions.setGroupKeys([...keys, column.key]),
    },
  ];
}

export default groupingHeaderMenuItems;
