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

import { get } from '@lowdefy/helpers';

function filterMenuList(context, { menuList }) {
  const { authorize } = context;
  const filtered = menuList
    .map((item) => {
      if (item.type === 'MenuLink') {
        if (authorize(item)) {
          return item;
        }
        return null;
      }
      if (item.type === 'MenuGroup') {
        const filteredSubItems = filterMenuList(context, {
          menuList: get(item, 'links', { default: [] }),
        });
        if (filteredSubItems.length > 0) {
          return {
            ...item,
            links: filteredSubItems,
          };
        }
        return null;
      }
      if (item.type === 'MenuDivider') {
        return item;
      }
      return null;
    })
    .filter((item) => item !== null);
  return filtered.filter((item, i, arr) => {
    if (item.type !== 'MenuDivider') return true;
    if (i === 0) return false;
    if (i === arr.length - 1) return false;
    if (arr[i - 1].type === 'MenuDivider') return false;
    return true;
  });
}

export default filterMenuList;
