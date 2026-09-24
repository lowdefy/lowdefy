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

import { matchesPattern } from './matchPattern.js';

// Maps each item id to the role names whose patterns match it, for one auth
// entity (pages, api or websockets).
function getEntityRoles({ components, entity }) {
  const roles = components.auth[entity].roles;
  const itemIds = (components[entity] ?? []).map((item) => item.id);
  const itemRoles = {};
  Object.keys(roles).forEach((roleName) => {
    roles[roleName].forEach((pattern) => {
      itemIds.forEach((itemId) => {
        if (matchesPattern(itemId, pattern)) {
          if (!itemRoles[itemId]) {
            itemRoles[itemId] = new Set();
          }
          itemRoles[itemId].add(roleName);
        }
      });
    });
  });
  Object.keys(itemRoles).forEach((itemId) => {
    itemRoles[itemId] = [...itemRoles[itemId]];
  });
  return itemRoles;
}

export default getEntityRoles;
