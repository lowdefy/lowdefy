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

import { AuthenticationError } from '../../context/errors';
import getOpenIdClient from './getOpenIdClient';
import getOpenIdConfig from './getOpenIdConfig';
import issueAccessToken from './issueAccessToken';
import setAuthorizationCookie from './setAuthorizationCookie';
import setIdTokenCookie from './setIdTokenCookie';
import verifyOpenIdStateToken from './verifyOpenIdStateToken';

async function openIdCallback(context, { code, state }) {
  const openIdConfig = getOpenIdConfig(context);
  try {
    const { pageId, urlQuery } = verifyOpenIdStateToken(context, { token: state });

    const client = await getOpenIdClient(context, { openIdConfig });
    const tokenSet = await client.callback(
      openIdConfig.redirectUri,
      { code },
      { response_type: 'code' }
    );
    const claims = tokenSet.claims();
    const idToken = tokenSet.id_token;

    const accessToken = issueAccessToken(context, { claims });
    setAuthorizationCookie(context, { accessToken });
    setIdTokenCookie(context, { idToken });

    return {
      pageId,
      urlQuery,
    };
  } catch (error) {
    throw new AuthenticationError(error);
  }
}

export default openIdCallback;
