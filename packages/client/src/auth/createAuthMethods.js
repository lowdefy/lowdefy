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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

function getCallbackUrl({ lowdefy, callbackUrl = {} }) {
  const { home, pageId, urlQuery, url } = callbackUrl;

  if ([!home, !pageId, !url].filter((v) => !v).length > 1) {
    throw Error(
      `Invalid Link: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined.`
    );
  }
  const query = type.isNone(urlQuery) ? '' : `${urlQueryFn.stringify(urlQuery)}`;

  if (home === true) {
    return `/${lowdefy.home.configured ? '' : lowdefy.home.pageId}${query ? `?${query}` : ''}`;
  }
  if (type.isString(pageId)) {
    return `/${pageId}${query ? `?${query}` : ''}`;
  }
  if (type.isString(url)) {
    return `${url}${query ? `?${query}` : ''}`;
  }

  return undefined;
}

function createAuthMethods(lowdefy, auth) {
  // login and logout are Lowdefy function that handle action params
  // signIn and signOut are the next-auth methods
  function login({ authUrl, callbackUrl, providerId, ...rest } = {}) {
    if (type.isNone(providerId) && auth.authConfig?.providers.length === 1) {
      providerId = auth.authConfig.providers[0].id;
    }

    return auth.signIn(
      providerId,
      { ...rest, callbackUrl: getCallbackUrl({ lowdefy, callbackUrl }) },
      authUrl?.urlQuery
    );
  }

  function logout({ callbackUrl, redirect } = {}) {
    return auth.signOut({ callbackUrl: getCallbackUrl({ lowdefy, callbackUrl }), redirect });
  }

  async function updateSession() {
    const session = await auth.getSession();
    lowdefy.user = session?.user ?? null;
  }

  return {
    login,
    logout,
    updateSession,
  };
}

export default createAuthMethods;
