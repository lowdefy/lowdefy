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

function getProtectedApi({ components }) {
  const endpointIds = (components.api || []).map((endpoint) => endpoint.id);
  let protectedApi = [];

  if (type.isArray(components.auth.api.public)) {
    protectedApi = endpointIds.filter(
      (endpointId) => !components.auth.api.public.includes(endpointId)
    );
  } else if (components.auth.api.protected === true) {
    protectedApi = endpointIds;
  } else if (type.isArray(components.auth.api.protected)) {
    protectedApi = components.auth.api.protected;
  }
  return protectedApi;
}

export default getProtectedApi;
