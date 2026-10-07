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

// A module websocket needs a signed-in caller unless the module declares it
// public (manifest auth.websockets.public) or the app's auth.websockets rules
// make it public explicitly: public: true, or a public list (under which an
// unlisted id is protected already). With no rule, or a protected list that
// does not name it, an app websocket resolves public by default; a module
// websocket is protected instead, because the app developer did not write it
// and nothing prompts them to protect it. Without app auth there is no caller
// to gate, so module websockets follow the app's rules unchanged.
// Returns the module websocket ids to add to the protected ids, and the
// module-declared public ids, which stay public in every mode.
function getModuleWebsocketAuth({ components, context }) {
  const publicIds = context.moduleAuthPublicWebsockets ?? [];
  if (components.auth.configured !== true) {
    return { protectedIds: [], publicIds };
  }
  const entityConfig = components.auth.websockets;
  if (entityConfig.public === true || type.isArray(entityConfig.public)) {
    return { protectedIds: [], publicIds };
  }
  return { protectedIds: context.moduleWebsocketIds ?? [], publicIds };
}

export default getModuleWebsocketAuth;
