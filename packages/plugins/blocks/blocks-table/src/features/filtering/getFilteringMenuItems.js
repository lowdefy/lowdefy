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

import getFilteredKeys from './getFilteredKeys.js';

// Header menu items (the headerMenu extension point): open the column filter, clear it.
function getFilteringMenuItems({ column, api }) {
  if (!column.filterable) return [];
  const items = [
    {
      key: 'filter',
      label: 'Filter…',
      section: 'filter',
      onClick: () => api.actions.openColumnFilter({ key: column.key }),
    },
  ];
  if (getFilteredKeys(api.state.filter).has(column.key)) {
    items.push({
      key: 'clearFilter',
      label: 'Clear filter',
      section: 'filter',
      onClick: () => api.actions.updateColumnFilter({ key: column.key, condition: null }),
    });
  }
  return items;
}

export default getFilteringMenuItems;
