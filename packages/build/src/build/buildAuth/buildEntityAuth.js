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
    // A webhook endpoint's transport is public and has no caller to gate, so
    // its own auth is inert - roles cannot protect it. Force the developer to
    // acknowledge that by declaring the endpoint EXPLICITLY public (listed in
    // auth.api.public), rather than relying on the defaulted public that an
    // endpoint in neither list resolves to. An implicit/defaulted public, a
    // protected endpoint, or one carrying roles is a build error - the webhook
    // earns trust at runtime through its declared verify gate, never from auth
    // (Decision 3). webhook may be `true` or the `{ verify }` object, so gate
    // on truthiness, not `=== true`.
    if (entity === 'api' && item.webhook && !isInPatternList(item.id, configPublic)) {
      throw new ConfigError(
        `Endpoint "${item.id}" is a webhook receiver and must be declared explicitly public - list it in "auth.api.public". The webhook transport is public and has no caller to gate, so "auth.api.protected" and roles cannot protect it; the routine authenticates the caller itself (a declared webhook.verify gate). Remove the webhook flag if the endpoint is not a webhook receiver.`,
        { configKey: item['~k'] }
      );
    }
  });

  return components;
}

export default buildEntityAuth;
