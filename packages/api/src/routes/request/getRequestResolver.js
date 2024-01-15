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

import { ConfigurationError } from '../../context/errors.js';

function getRequestResolver({ logger }, { connection, requestConfig }) {
  const requestResolver = connection.requests[requestConfig.type];

  if (!requestResolver) {
    const err = new ConfigurationError(`Request type "${requestConfig.type}" can not be found.`);
    logger.debug(
      { params: { id: requestConfig.requestId, type: requestConfig.type }, err },
      err.message
    );
    throw err;
  }

  return requestResolver;
}

export default getRequestResolver;
