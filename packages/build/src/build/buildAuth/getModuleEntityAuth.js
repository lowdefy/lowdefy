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

// Agents are served from the API surface, so the app's auth.api rules govern
// them as they do endpoints.
const appRuleSections = {
  agents: 'api',
  api: 'api',
  websockets: 'websockets',
};

// A module agent, endpoint or websocket needs a signed-in caller unless the
// module declares it public (manifest auth.agents.public, auth.api.public or
// auth.websockets.public) or the app's rules for it make it public
// explicitly: public: true, or a public list (under which an unlisted id is
// protected already). With no rule, or a protected list that does not name it,
// an app item resolves public by default; a module item is protected instead,
// because the app developer did not write it and nothing prompts them to
// protect it. Without app auth there is no caller to gate, so module items
// follow the app's rules unchanged.
// Returns the module item ids to add to the protected ids, and the
// module-declared public ids, which stay public in every mode.
function getModuleEntityAuth({ components, context, entity }) {
  const publicIds = context.moduleAuthPublicEntities?.[entity] ?? [];
  if (components.auth.configured !== true) {
    return { protectedIds: [], publicIds };
  }
  const appRule = components.auth[appRuleSections[entity]];
  if (appRule.public === true || type.isArray(appRule.public)) {
    return { protectedIds: [], publicIds };
  }
  return { protectedIds: context.moduleEntityIds?.[entity] ?? [], publicIds };
}

export default getModuleEntityAuth;
