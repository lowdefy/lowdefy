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

import path from 'node:path';
import {
  callEndpoint,
  callRequest,
  getPageConfig,
  getRootConfig,
  parseRequestBody,
  redactErrorResponse,
} from '@lowdefy/api';
import { expectedAnswers, isExpectedError } from '@lowdefy/errors';
import { buildPagePath, serializer, type } from '@lowdefy/helpers';
import { createHeadlessHost, loadClientPlugins } from '@lowdefy/journey-headless';
import { matchPagePath } from '@lowdefy/node-utils';
import { findSessionDocuments } from '@lowdefy/test-utils/dataSets';

import buildPageIfNeeded from '../server/jitPageBuilder.js';
import createInProcessRequest from './createInProcessRequest.js';
import { JOURNEY_COOKIES, writeJourneyCookie } from '../server/journeyCookies.js';
import recordingCookiePayload from '../server/recording/recordingCookiePayload.js';
import resolveHeadlessUser from '../server/auth/resolveHeadlessUser.js';

function createErrorSink() {
  const errors = [];
  return {
    errors,
    add: ({ error, source }) => {
      errors.push({ error, source });
    },
  };
}

// The answer a call gets, as the server's routes and error handler answer it (and as
// @lowdefy/test-utils' answerCall answers for a build): a 200 with the call's result, an expected
// outcome with its status and { name, message }, or a fault, logged and answered 500.
async function answer({ context, faults, run }) {
  let result;
  try {
    result = await run(context);
  } catch (error) {
    if (isExpectedError(error)) {
      const { status } = expectedAnswers[error.name] ?? expectedAnswers.UserError;
      const refusal = new Error(error.message);
      refusal.name = error.name;
      return {
        status,
        success: false,
        response: null,
        error: refusal,
        body: { name: error.name, message: error.message },
        faults,
      };
    }
    await context.handleError(error);
    const text = JSON.stringify(redactErrorResponse(context, error));
    return {
      status: 500,
      success: false,
      response: null,
      error: serializer.deserializeFromString(text),
      body: JSON.parse(text),
      faults,
    };
  }
  const text = JSON.stringify(result);
  const read = serializer.deserializeFromString(text);
  return {
    status: 200,
    success: read.success,
    response: read.response ?? null,
    error: read.error ?? null,
    body: JSON.parse(text),
    faults,
  };
}

/**
 * A @lowdefy/journey-headless host on the running dev server: a headless journey's pages are
 * built on demand and read, and its requests and endpoint calls run, in this process through
 * @lowdefy/api, as the dev server's own routes run them, on the journey's data session and with
 * its mutant and recording cookies. Nothing is rebuilt: an edited page is rebuilt by its next
 * read, as the page route rebuilds it.
 *
 * - user: who the journey is by default, as resolveJourneyDataSet resolved it (a user object,
 *   "none" or undefined for the roleless default caller).
 * - dataSet, session, store: the journey's data set, its open data session (openDataSession) and
 *   the data store it is on; all undefined for a journey with no data set.
 * - cookies: the journey cookies its browser contexts would carry (recording, mutant).
 * - counter: a network counter (createNetworkCounter) every page read and call is recorded on,
 *   for the run's exercised paths.
 */
async function createDevServerHost({
  counter,
  dataSet,
  mutantCookie,
  origin,
  recording,
  session,
  store,
  user,
}) {
  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd();
  // Deferred, as runEndpoint defers it: createLowdefyContext imports the dev build's plugin
  // artifacts, which exist only in a running dev server.
  const { default: createLowdefyContext } = await import('../server/createLowdefyContext.js');
  const cookies = [
    writeJourneyCookie({
      name: JOURNEY_COOKIES.recording.name,
      payload: recordingCookiePayload({ recording }),
      origin,
    }),
  ];
  if (!type.isUndefined(mutantCookie)) {
    cookies.push(
      writeJourneyCookie({ name: JOURNEY_COOKIES.mutant.name, payload: mutantCookie, origin })
    );
  }
  const users = dataSet?.users ?? {};

  // A user as calls name one (a data set user's name, "none", an object, or none for the
  // journey's), as createLowdefyContext injects it: an object, merged there over the roleless
  // default caller ({} is that default), or undefined for "none": no injected caller, so the
  // app's own auth decides, signed out.
  function toCaller(callUser) {
    const named = callUser ?? user;
    if (type.isNone(named)) {
      return {};
    }
    if (type.isString(named) && named !== 'none') {
      if (!Object.prototype.hasOwnProperty.call(users, named)) {
        throw new Error(
          `User "${named}" is not in the journey's data set. Its users are ${
            Object.keys(users)
              .map((name) => `"${name}"`)
              .join(', ') || 'none'
          }.`
        );
      }
      return users[named];
    }
    return named === 'none' ? undefined : named;
  }

  async function createContext({ callUser, method, requestPath }) {
    const faults = [];
    const context = await createLowdefyContext({
      c: createInProcessRequest({ cookies, method, origin, path: requestPath }),
      dataSession: session?.session,
      user: toCaller(callUser),
    });
    // The faults the call logs at error level, as answerCall's faults: what a browser journey's
    // server error entries hold for the run's invariants.
    const handleError = context.handleError;
    context.handleError = async (error) => {
      if (!isExpectedError(error)) {
        faults.push(error);
      }
      return handleError(error);
    };
    return { context, faults };
  }

  const root = await createContext({ method: 'GET', requestPath: '/api/root' });
  const rootConfig = JSON.parse(JSON.stringify(await getRootConfig(root.context)));
  counter.recordCall({ url: `${origin}/api/root`, method: 'GET' });

  async function readPageConfig({ pageId, path: pagePath, pathParams, urlQuery, user: pageUser }) {
    const matchedPath =
      pagePath ?? buildPagePath({ pageId, path: rootConfig.pagePaths?.[pageId], pathParams });
    const { context } = await createContext({
      callUser: pageUser,
      method: 'GET',
      requestPath: `/api/page/${matchedPath}`,
    });
    const match = matchPagePath({
      routes: await context.readConfigFile('routes.json'),
      path: matchedPath,
    });
    if (match !== null) {
      await buildPageIfNeeded({ pageId: match.pageId, buildDirectory, configDirectory });
    }
    counter.recordCall({ url: `${origin}/api/page/${matchedPath}`, method: 'GET' });
    const page = await getPageConfig(context, { path: matchedPath, urlQuery: urlQuery ?? {} });
    if (page.status !== 'ok') {
      throw new Error(
        `Page "${pageId ?? matchedPath}" did not open: the page route answered "${page.status}".`
      );
    }
    return {
      matchedPath,
      pageConfig: JSON.parse(JSON.stringify(page.pageConfig)),
      pageId: page.pageId,
      pathParams: page.pathParams,
    };
  }

  async function call({
    actionId,
    blockId,
    endpointId,
    kind,
    pageId,
    payload,
    requestId,
    user: callUser,
  }) {
    const requestPath =
      kind === 'request' ? `/api/request/${pageId}/${requestId}` : `/api/endpoints/${endpointId}`;
    counter.recordCall({ url: `${origin}${requestPath}`, method: 'POST' });
    const body = kind === 'request' ? { actionId, blockId, payload } : { blockId, pageId, payload };
    const parsed = parseRequestBody({ text: JSON.stringify(body) });
    const { context, faults } = await createContext({ callUser, method: 'POST', requestPath });
    if (kind === 'request') {
      // As the request route does: the page's request artifact is built before it is read.
      await buildPageIfNeeded({ pageId, buildDirectory, configDirectory });
      return answer({
        context,
        faults,
        run: (callContext) =>
          callRequest(callContext, {
            blockId: parsed.blockId,
            pageId,
            payload: parsed.payload,
            requestId,
          }),
      });
    }
    return answer({
      context,
      faults,
      run: (callContext) =>
        callEndpoint(callContext, {
          blockId: parsed.blockId,
          endpointId,
          pageId: parsed.pageId,
          payload: parsed.payload,
        }),
    });
  }

  async function findDocuments({ collection, connectionId, match }) {
    if (type.isUndefined(session)) {
      throw new Error(
        'expect.db reads the journey\'s data set database, and this journey declares no "data".'
      );
    }
    return findSessionDocuments({
      buildDirectory,
      client: store.client,
      collection,
      connectionId,
      match,
      session: session.session,
    });
  }

  // The user a page renders: null for a signed-out caller, else the caller over the roleless
  // default, as the headless browser's injected user is.
  function resolveUser(pageUser) {
    const caller = toCaller(pageUser);
    return type.isUndefined(caller) ? null : resolveHeadlessUser({ user: caller });
  }

  let clientPlugins = null;
  return createHeadlessHost({
    call,
    // The data session belongs to the journey run, which closes it (runJourneyHeadless).
    close: async () => {},
    dataSession: session ?? null,
    errorSink: createErrorSink(),
    findDocuments,
    loadClientPlugins: () => {
      clientPlugins = clientPlugins ?? loadClientPlugins({ buildDirectory });
      return clientPlugins;
    },
    readPageConfig,
    resolveUser,
    rootConfig,
    userNames: Object.keys(users),
  });
}

export default createDevServerHost;
