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

import { getFromObject } from '@lowdefy/operators';

function _secret({ location, params, secrets = {} }) {
  if (params === true || params.all) {
    throw new Error(
      `Operator Error: Getting all secrets is not allowed. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  // Filter out OpenID Connect and JSON web token secrets
  // eslint-disable-next-line no-unused-vars
  const { OPENID_CLIENT_SECRET, JWT_SECRET, ...rest } = secrets;
  return getFromObject({
    location,
    object: { ...rest },
    operator: '_secret',
    params,
  });
}

export default _secret;
