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

import { AuthenticationError, ConfigError } from '@lowdefy/errors';

import isUnauthenticatedHuman from './isUnauthenticatedHuman.js';

// A missing endpoint answers the same as a protected one for an anonymous
// caller on an auth'd app - the message is byte-identical to the one
// authorizeApiEndpoint throws, so present and absent are indistinguishable
// before authenticating. Every other caller keeps the opaque does-not-exist.
async function getEndpointConfig(context, { endpointId }) {
  const { logger, readConfigFile } = context;
  const endpoint = await readConfigFile(`api/${endpointId}.json`);
  if (!endpoint) {
    const err = (await isUnauthenticatedHuman(context))
      ? new AuthenticationError(`Authentication required for API endpoint "${endpointId}".`)
      : new ConfigError(`API Endpoint "${endpointId}" does not exist.`);
    logger.debug({ params: { endpointId }, err }, err.message);
    throw err;
  }
  return endpoint;
}

export default getEndpointConfig;
