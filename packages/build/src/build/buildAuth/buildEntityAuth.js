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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import getAlwaysPublicPageIds from './getAlwaysPublicPageIds.js';
import getEntityRoles from './getEntityRoles.js';
import getProtectedEntities from './getProtectedEntities.js';
import { isInPatternList } from './matchPattern.js';

const labels = {
  api: 'Endpoint',
  pages: 'Page',
  websockets: 'Websocket',
};

// Writes the auth artifact ({ public, roles? }) onto every item of one auth
// entity (pages, api or websockets), so the runtime reads a resolved
// decision and never re-derives it from patterns.
function buildEntityAuth({ components, context, entity }) {
  const label = labels[entity];
  let protectedIds = getProtectedEntities({ components, entity });
  if (entity === 'pages') {
    // authPages role pages and module-contributed public pages stay public
    // in both the protected-list and public-list modes.
    const alwaysPublicIds = getAlwaysPublicPageIds({ components, context });
    protectedIds = protectedIds.filter((id) => !alwaysPublicIds.includes(id));
  }
  const entityRoles = getEntityRoles({ components, entity });
  let configPublic = [];
  if (type.isArray(components.auth[entity].public)) {
    configPublic = components.auth[entity].public;
  }

  (components[entity] ?? []).forEach((item) => {
    // The 404 page must always be public so unauthenticated users can see it.
    if (entity === 'pages' && item.id === '404') {
      item.auth = {
        public: true,
      };
      return;
    }
    if (entityRoles[item.id]) {
      if (isInPatternList(item.id, configPublic)) {
        throw new ConfigError(`${label} "${item.id}" is both protected by roles and public.`, {
          received: entityRoles[item.id],
          configKey: item['~k'],
        });
      }
      item.auth = {
        public: false,
        roles: entityRoles[item.id],
      };
    } else if (protectedIds.includes(item.id)) {
      item.auth = {
        public: false,
      };
    } else {
      item.auth = {
        public: true,
      };
    }
  });

  return components;
}

export default buildEntityAuth;
