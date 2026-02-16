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

import { ConfigError } from '@lowdefy/errors';

function authorizeApiEndpoint({ authorize, logger }, { endpointConfig }) {
  if (!authorize(endpointConfig)) {
    logger.debug({
      event: 'debug_api_authorize',
      authorized: false,
      auth_config: endpointConfig.auth,
    });
    throw new ConfigError({
      message: `API Endpoint "${endpointConfig.endpointId}" does not exist.`,
    });
  }
  logger.debug({
    event: 'debug_api_authorize',
    authorized: true,
    auth_config: endpointConfig.auth,
  });
}

export default authorizeApiEndpoint;
