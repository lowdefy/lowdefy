/*
  Copyright 2020-2026 Lowdefy, Inc

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
    throw new Error(
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

// The action's callbackUrl param wins; otherwise honor the callbackUrl query
// param set by the unauthenticated page redirect, so login returns to the
// page the user asked for. Only relative paths are accepted from the query
// to avoid open redirects.
function resolveCallbackURL({ lowdefy, callbackUrl }) {
  const explicit = getCallbackUrl({ lowdefy, callbackUrl });
  if (!type.isNone(explicit)) {
    if (explicit.startsWith('/')) {
      return `${lowdefy.basePath ?? ''}${explicit}`;
    }
    return explicit;
  }
  const window = lowdefy._internal?.globals?.window;
  const fromQuery = new URLSearchParams(window?.location?.search ?? '').get('callbackUrl');
  if (type.isString(fromQuery) && fromQuery.startsWith('/')) {
    return fromQuery;
  }
  return undefined;
}

// BetterAuth client calls resolve with { data, error } instead of throwing -
// rethrow so action onError chains fire on failed sign-in attempts.
async function unwrap(promise) {
  const { data, error } = await promise;
  if (error) {
    const authError = new Error(error.message ?? error.statusText ?? 'Authentication failed.');
    authError.code = error.code;
    authError.status = error.status;
    throw authError;
  }
  return data;
}

function createAuthMethods(lowdefy, auth) {
  // login and logout are Lowdefy functions that handle action params;
  // the auth object provides the BetterAuth client methods.
  async function login({
    callbackUrl,
    email,
    magicLink,
    name,
    password,
    providerId,
    signUp,
    ...rest
  } = {}) {
    const callbackURL = resolveCallbackURL({ lowdefy, callbackUrl });
    const providers = auth.authConfig?.providers ?? [];

    if (type.isNone(providerId) && type.isNone(email) && providers.length === 1) {
      providerId = providers[0].id;
    }

    if (!type.isNone(providerId)) {
      const provider = providers.find((configured) => configured.id === providerId);
      if (type.isNone(provider)) {
        throw new Error(`Login provider "${providerId}" is not a configured auth provider.`);
      }
      if (provider.type === 'GenericOAuth') {
        return unwrap(auth.signInOauth2({ providerId, callbackURL, ...rest }));
      }
      return unwrap(
        auth.signInSocial({ provider: provider.type.toLowerCase(), callbackURL, ...rest })
      );
    }
    if (magicLink === true) {
      if (!type.isString(email)) {
        throw new Error('Login with magicLink requires an "email" param.');
      }
      return unwrap(auth.signInMagicLink({ email, callbackURL, ...rest }));
    }
    if (signUp === true) {
      // With requireEmailVerification the response carries no session - the
      // page shows a "verify your email" message instead of navigating.
      return unwrap(auth.signUpEmail({ email, password, name, callbackURL, ...rest }));
    }
    if (!type.isNone(email) || !type.isNone(password)) {
      const data = await unwrap(auth.signInEmail({ email, password, ...rest }));
      const window = lowdefy._internal?.globals?.window;
      if (callbackURL && window) {
        window.location.assign(callbackURL);
      }
      return data;
    }
    throw new Error(
      'Login requires a "providerId", "email" and "password", "magicLink: true", or "signUp: true" param.'
    );
  }

  async function logout({ callbackUrl } = {}) {
    const data = await unwrap(auth.signOut());
    const callbackURL = getCallbackUrl({ lowdefy, callbackUrl });
    const window = lowdefy._internal?.globals?.window;
    if (callbackURL && window) {
      window.location.assign(`${lowdefy.basePath ?? ''}${callbackURL}`);
    }
    return data;
  }

  // Bypasses the cookie cache (a live re-resolve), so role, attribute or
  // session changes surface immediately instead of after cookieCache.maxAge.
  async function updateSession() {
    const session = await unwrap(auth.getSession({ disableCookieCache: true }));
    lowdefy.user = session?.user ? { roles: [], ...session.user } : null;
  }

  return {
    login,
    logout,
    updateSession,
  };
}

export default createAuthMethods;
