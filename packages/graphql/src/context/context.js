/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { get } from '@lowdefy/helpers';
import createGetController from '../controllers/getController';
import createGetLoader from './getLoader';

function createContext(config) {
  const { CONFIGURATION_BASE_PATH, logger, getSecrets, development } = config;
  const bootstrapContext = {
    CONFIGURATION_BASE_PATH,
    development,
    getSecrets,
    logger,
  };
  // lambda context function signature is ({ event }),
  // but express is ({ req })
  async function context({ event, req }) {
    let headers;
    if (event) {
      headers = event.headers;
    }
    if (req) {
      headers = req.headers;
    }
    bootstrapContext.host = get(headers, 'Host') || get(headers, 'host');
    bootstrapContext.getLoader = createGetLoader(bootstrapContext);
    bootstrapContext.getController = createGetController(bootstrapContext);
    return {
      getController: bootstrapContext.getController,
      logger,
    };
  }
  return context;
}

export default createContext;
