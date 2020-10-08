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

const createContext = (contextOptions) => {
  const bootstrapContext = {
    DEPLOYMENT_ID: contextOptions.DEPLOYMENT_ID,
    DEPLOYMENT_NAME: contextOptions.DEPLOYMENT_NAME,
    DOMAIN_NAME: contextOptions.DOMAIN_NAME,
    logger: contextOptions.logger,
  };

  const context = async (input) => {
    const headers = contextOptions.getHeadersFromInput(input);
    const secrets = await contextOptions.getSecrets();

    bootstrapContext.ORIGIN = get(headers, 'Origin') || get(headers, 'origin');
    bootstrapContext.HOST = get(headers, 'Host') || get(headers, 'host');

    bootstrapContext.getConnectionSecrets = () => secrets.CONNECTION_SECRETS;

    bootstrapContext.getLoader = createGetLoader(bootstrapContext);
    bootstrapContext.getController = createGetController(bootstrapContext);

    return {
      getController: bootstrapContext.getController,
      logger: bootstrapContext.logger,
    };
  };
  return context;
};

export default createContext;
