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

import { decodeServerError } from '@lowdefy/engine';
import { expectedErrorNames, lowdefyErrorTypes } from '@lowdefy/errors';
import { translate, type } from '@lowdefy/helpers';

import awaitUnlessUnloading from './awaitUnlessUnloading.js';
import NonJsonResponseError from './NonJsonResponseError.js';
import parseJsonObject from './parseJsonObject.js';
import recordCallerStamp from './recordCallerStamp.js';
import reloadPage from './reloadPage.js';
import shouldReloadForAuthError from './shouldReloadForAuthError.js';
import shouldReloadForBuild from './shouldReloadForBuild.js';
import shouldReloadForCaller from './shouldReloadForCaller.js';

// buildId is the build this bundle was made from. The production server
// refuses a call from another build with a 409 before running anything, since
// an old page's payload can be the wrong shape for the new build's request and
// still be written. The tab then reloads once onto the current build. The
// promise never settles: the page is unloading, and a rejection would run the
// action's catch actions and report the refusal as an error. Only the
// production client carries a build id; the server lets a call naming none
// through (dev and e2e pages, third-party webhooks). A fetch the browser
// cancels as the page unloads never settles either (awaitUnlessUnloading).
//
// lowdefy.user is the caller the page renders. The tab also reloads when the
// server answered as another caller or with other roles, or refused the
// rendered caller in a way that means the page itself is no longer theirs
// (shouldReloadForCaller, shouldReloadForAuthError), so it never shows one
// caller's data to another. Otherwise the response's caller stamp is kept as
// the last one seen (recordCallerStamp).
// reloadOnAuthorizationError is set for page requests, which share the page's
// auth, and not for endpoints, which carry their own.
async function request({
  buildId,
  url,
  method = 'GET',
  body,
  reloadOnAuthorizationError = false,
  lowdefy,
}) {
  // Read per call: the rendered caller changes with the session.
  const { user } = lowdefy;
  const headers = { 'Content-Type': 'application/json' };
  if (!type.isNone(buildId)) {
    headers['x-lowdefy-build'] = buildId;
  }
  const res = await awaitUnlessUnloading({
    lowdefy,
    promise: fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    }),
  });
  const serverCaller = res.headers.get('x-lowdefy-caller');
  if (shouldReloadForCaller({ serverCaller, user, window })) {
    reloadPage({ lowdefy, window });
    return new Promise(() => {});
  }
  recordCallerStamp({ lowdefy, serverCaller });
  if (!res.ok) {
    const text = await awaitUnlessUnloading({ lowdefy, promise: res.text() });
    const body = parseJsonObject(text);
    if (body === null) {
      throw new NonJsonResponseError({ status: res.status, text });
    }
    if (
      res.status === 409 &&
      shouldReloadForBuild({ bundleBuildId: buildId, serverBuildId: body?.buildId, window })
    ) {
      reloadPage({ lowdefy, window });
      return new Promise(() => {});
    }
    if (body?.['~e']) {
      throw decodeServerError(body);
    }
    // The server answers an expected outcome (an auth gate's 401 or 403, a
    // UserError's 400) itself, as { name, message } with no serialized error.
    // Rebuilding its class keeps the name the engine, handleError and the dev
    // tools tell an expected outcome from a fault by.
    if (expectedErrorNames.has(body?.name)) {
      const ExpectedError = lowdefyErrorTypes[body.name];
      const error = new ExpectedError(body.message);
      if (shouldReloadForAuthError({ error, reloadOnAuthorizationError, user, window })) {
        reloadPage({ lowdefy, window });
        return new Promise(() => {});
      }
      throw error;
    }
    throw new Error(body.message || translate({ key: 'client.requestError' }));
  }
  return awaitUnlessUnloading({ lowdefy, promise: res.json() });
}

export default request;
