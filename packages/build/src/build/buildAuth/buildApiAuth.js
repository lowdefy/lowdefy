/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2024 Lowdefy, Inc

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
import getApiRoles from './getApiRoles.js';
import getProtectedApi from './getProtectedApi.js';

function buildApiAuth({ components }) {
  const protectedApiEndpoints = getProtectedApi({ components });
  console.log(protectedApiEndpoints);
  const apiRoles = getApiRoles({ components });
  console.log(apiRoles);
  let configPublicApi = [];
  if (type.isArray(components.auth.api.public)) {
    configPublicApi = components.auth.api.public;
  }

  (components.api || []).forEach((endpoint) => {
    if (apiRoles[endpoint.id]) {
      if (configPublicApi.includes(endpoint.id)) {
        throw new Error(
          `Page "${endpoint.id}" is both protected by roles ${JSON.stringify(
            apiRoles[endpoint.id]
          )} and public.`
        );
      }
      endpoint.auth = {
        public: false,
        roles: apiRoles[endpoint.id],
      };
    } else if (protectedApiEndpoints.includes(endpoint.id)) {
      endpoint.auth = {
        public: false,
      };
    } else {
      endpoint.auth = {
        public: true,
      };
    }
  });

  return components;
}

export default buildApiAuth;
