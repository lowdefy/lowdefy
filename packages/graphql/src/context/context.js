/* eslint-disable no-param-reassign */

/*
   Copyright 2020 Lowdefy, Inc

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

import get from '@lowdefy/get';
import createGetController from './getController';
import createGetLoader from './getLoader';

function createContext(config) {
  const bootstrapContext = {
    DEPLOYMENT_ID: config.DEPLOYMENT_ID,
    DEPLOYMENT_NAME: config.DEPLOYMENT_NAME,
    DOMAIN_NAME: config.DOMAIN_NAME,
    CONFIGURATION_BASE_PATH: config.CONFIGURATION_BASE_PATH,
    logger: config.logger,
  };

  async function context(input) {
    const headers = config.getHeadersFromInput(input);
    const secrets = await config.getSecrets();

    bootstrapContext.ORIGIN = get(headers, 'Origin') || get(headers, 'origin');
    bootstrapContext.HOST = get(headers, 'Host') || get(headers, 'host');

    bootstrapContext.getConnectionSecrets = () => secrets.CONNECTION_SECRETS;

    bootstrapContext.getLoader = createGetLoader(bootstrapContext);
    bootstrapContext.getController = createGetController(bootstrapContext);

    return {
      getController: bootstrapContext.getController,
      logger: bootstrapContext.logger,
    };
  }
  return context;
}

export default createContext;
