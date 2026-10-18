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
import { parseCallerStamp, translate, type } from '@lowdefy/helpers';

import recordCallerStamp from './recordCallerStamp.js';
import shouldReloadForAuthError from './shouldReloadForAuthError.js';
import shouldReloadForBuild from './shouldReloadForBuild.js';
import shouldReloadForCaller from './shouldReloadForCaller.js';

// buildId is the build this bundle was made from. The production server
// refuses a call from another build with a 409 before running anything, since
// an old page's payload can be the wrong shape for the new build's request and
// still be written. The host then moves once onto the current build
// (host.onBuildChanged; a reload on the web). The promise never settles: the
// page is being replaced, and a rejection would run the action's catch actions
// and report the refusal as an error. Only the production client carries a
// build id; the server lets a call naming none through (dev and e2e pages,
// third-party webhooks).
//
// lowdefy.user is the caller the page renders. The host also moves onto the
// server's caller (host.onCallerChanged; a reload on the web) when the server
// answered as another caller or with other roles, or refused the rendered
// caller in a way that means the page itself is no longer theirs
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
  const { host } = lowdefy._internal;
  const headers = { 'Content-Type': 'application/json' };
  if (!type.isNone(buildId)) {
    headers['x-lowdefy-build'] = buildId;
  }
  const res = await host.fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  const serverCaller = res.headers.get('x-lowdefy-caller');
  if (shouldReloadForCaller({ serverCaller, sessionStorage: host.sessionStorage, user })) {
    host.onCallerChanged(parseCallerStamp(serverCaller));
    return new Promise(() => {});
  }
  recordCallerStamp({ lowdefy, serverCaller });
  if (!res.ok) {
    const body = await res.json();
    if (
      res.status === 409 &&
      shouldReloadForBuild({
        bundleBuildId: buildId,
        serverBuildId: body?.buildId,
        sessionStorage: host.sessionStorage,
      })
    ) {
      host.onBuildChanged({ serverBuildId: body.buildId });
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
      if (
        shouldReloadForAuthError({
          error,
          reloadOnAuthorizationError,
          sessionStorage: host.sessionStorage,
          user,
        })
      ) {
        host.onCallerChanged(parseCallerStamp(serverCaller));
        return new Promise(() => {});
      }
      throw error;
    }
    throw new Error(body.message || translate({ key: 'client.requestError' }));
  }
  return res.json();
}

export default request;
