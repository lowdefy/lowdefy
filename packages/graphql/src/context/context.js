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
import verifyAccessToken from './verifyAccessToken';

function createContext(config) {
  const {
    CONFIGURATION_BASE_PATH,
    development,
    getHeaders,
    getSecrets,
    getSetHeader,
    logger,
  } = config;
  const bootstrapContext = {
    CONFIGURATION_BASE_PATH,
    development,
    getSecrets,
    logger,
  };
  async function context(input) {
    bootstrapContext.headers = getHeaders(input);
    bootstrapContext.setHeader = getSetHeader(input);
    bootstrapContext.host =
      get(bootstrapContext.headers, 'Host') || get(bootstrapContext.headers, 'host');
    bootstrapContext.getLoader = createGetLoader(bootstrapContext);
    bootstrapContext.getController = createGetController(bootstrapContext);
    bootstrapContext.user = await verifyAccessToken(bootstrapContext);
    console.log(bootstrapContext.user);
    return {
      getController: bootstrapContext.getController,
      logger,
    };
  }
  return context;
}

export default createContext;
