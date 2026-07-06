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

function getWebsocketRoles({ components }) {
  const roles = components.auth.websockets.roles;
  const websocketIds = (components.websockets ?? []).map((websocket) => websocket.id);
  const websocketRoles = {};
  Object.keys(roles).forEach((roleName) => {
    roles[roleName].forEach((pattern) => {
      websocketIds.forEach((websocketId) => {
        if (matchesPattern(websocketId, pattern)) {
          if (!websocketRoles[websocketId]) {
            websocketRoles[websocketId] = new Set();
          }
          websocketRoles[websocketId].add(roleName);
        }
      });
    });
  });
  Object.keys(websocketRoles).forEach((websocketId) => {
    websocketRoles[websocketId] = [...websocketRoles[websocketId]];
  });
  return websocketRoles;
}

export default getWebsocketRoles;
