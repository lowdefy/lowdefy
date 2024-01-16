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

import { RequestError } from '../../context/errors.js';

async function callRequestResolver(
  { logger },
  { blockId, connectionProperties, payload, requestConfig, requestProperties, requestResolver }
) {
  try {
    const response = await requestResolver({
      blockId,
      connection: connectionProperties,
      connectionId: requestConfig.connectionId,
      pageId: requestConfig.pageId,
      payload,
      request: requestProperties,
      requestId: requestConfig.requestId,
    });
    return response;
  } catch (error) {
    const err = new RequestError(error.message);
    logger.debug(
      { params: { id: requestConfig.requestId, type: requestConfig.type }, err },
      err.message
    );
    throw err;
  }
}

export default callRequestResolver;
