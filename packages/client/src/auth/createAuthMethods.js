/*
  Copyright 2020-2022 Lowdefy, Inc

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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

function getCallbackUrl({ lowdefy, callbackUrl = {} }) {
  const { home, pageId, urlQuery } = callbackUrl;

  if ([!home, !pageId].filter((v) => !v).length > 1) {
    throw Error(`Invalid Link: To avoid ambiguity, only one of 'home' or 'pageId' can be defined.`);
  }
  const query = type.isNone(urlQuery) ? '' : `${urlQueryFn.stringify(urlQuery)}`;

  if (home === true) {
    return `/${lowdefy.home.configured ? '' : lowdefy.home.pageId}${query ? `?${query}` : ''}`;
  }
  if (type.isString(pageId)) {
    return `/${pageId}${query ? `?${query}` : ''}`;
  }

  return undefined;
}

function createAuthMethods({ lowdefy, auth }) {
  // login and logout are Lowdefy function that handle action params
  // signIn and signOut are the next-auth methods
  function login({ providerId, callbackUrl, authUrl = {} } = {}) {
    if (type.isNone(providerId) && auth.authConfig.providers.length === 1) {
      providerId = auth.authConfig.providers[0].id;
    }

    auth.signIn(
      providerId,
      { callbackUrl: getCallbackUrl({ lowdefy, callbackUrl }) },
      authUrl.urlQuery
    );
  }
  // TODO: fix callbackUrl
  function logout() {
    auth.signOut();
  }
  return {
    login,
    logout,
  };
}

export default createAuthMethods;
