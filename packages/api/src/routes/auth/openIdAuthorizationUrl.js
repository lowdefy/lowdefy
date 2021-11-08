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

import { ConfigurationError } from '../../context/errors.js';

import getOpenIdClient from './getOpenIdClient.js';
import getOpenIdConfig from './getOpenIdConfig.js';
import issueOpenIdStateToken from './issueOpenIdStateToken.js';

async function openIdAuthorizationUrl(context, { authUrlQueryParams, pageId, urlQuery }) {
  try {
    const openIdConfig = getOpenIdConfig(context);

    const state = issueOpenIdStateToken(context, {
      pageId,
      urlQuery,
    });

    const client = await getOpenIdClient(context, { openIdConfig });
    const openIdAuthorizationUrl = client.authorizationUrl({
      ...authUrlQueryParams,
      redirect_uri: openIdConfig.redirectUri,
      response_type: 'code',
      scope: openIdConfig.scope || 'openid profile email',
      state,
    });

    return { openIdAuthorizationUrl };
  } catch (error) {
    throw new ConfigurationError(error);
  }
}

export default openIdAuthorizationUrl;
