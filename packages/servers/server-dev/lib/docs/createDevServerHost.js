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
  runDetachedEndpoint,
  runWebhookEndpoint,
} from '@lowdefy/api';
import { expectedAnswers, isExpectedError, isForcedFailure } from '@lowdefy/errors';
import { buildPagePath, serializer, type } from '@lowdefy/helpers';
import { createHeadlessHost, loadClientPlugins } from '@lowdefy/journey-headless';
import { matchPagePath } from '@lowdefy/node-utils';
import { findSessionDocuments } from '@lowdefy/test-utils/dataSets';

import { buildPageWithContext, getPageJitEnrichment } from '../server/jitPageBuilder.js';
import createHeadlessSecrets from './createHeadlessSecrets.js';
import createInProcessRequest from './createInProcessRequest.js';
import readBuildArtifact from './readBuildArtifact.js';
import readClientJsMap from './readClientJsMap.js';
import readConnectionPlugins from './readConnectionPlugins.js';
import { JOURNEY_COOKIES, writeJourneyCookie } from '../server/journeyCookies.js';
import recordingCookiePayload from '../server/recording/recordingCookiePayload.js';
import resolveHeadlessUser from '../server/auth/resolveHeadlessUser.js';

const NOT_FOUND_PATH = '404';

function createErrorSink() {
  const errors = [];
  return {
    errors,
    add: ({ error, source }) => {
      errors.push({ error, source });
    },
  };
}

// The answer to a call that threw, as the server's error handler answers it: an expected outcome
// with its status and { name, message }, or a fault, logged and answered 500.
async function answerError({ context, detached, error, faults }) {
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
      detached,
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
    detached,
  };
}

// The answer a call gets, as the server's routes and error handler answer it (and as
// @lowdefy/test-utils' answerCall answers for a build): a 200 with the call's result, or what
// answerError answers when it threw.
async function answer({ context, detached, faults, run }) {
  let result;
  try {
    result = await run(context);
  } catch (error) {
    return answerError({ context, detached, error, faults });
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
    detached,
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
 * - secrets: the run's test values for the app's secrets, by name. Every call runs on the
 *   stand-ins a production build's test run reads, with these over them, never on the app's real
 *   LOWDEFY_SECRET_* (createHeadlessSecrets).
 */
async function createDevServerHost({
  counter,
  dataSet,
  mutantCookie,
  origin,
  recording,
  secrets,
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

  // The stand-ins cover the secrets the dev build names, and the dev server builds pages on demand:
  // the names are read again the first time this journey reads or requests a page (another journey
  // or a tab may have built it since), and after each build of one.
  let testSecrets = createHeadlessSecrets({ buildDirectory, secrets });
  const scannedPageIds = new Set();
  async function buildPage(pageId) {
    const built = await buildPageWithContext({ pageId, buildDirectory, configDirectory });
    if (built.result !== false && (built.result?.built === true || !scannedPageIds.has(pageId))) {
      scannedPageIds.add(pageId);
      testSecrets = createHeadlessSecrets({ buildDirectory, secrets });
    }
    return built;
  }

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
      testSecrets,
      user: toCaller(callUser),
    });
    // The faults the call logs at error level, as answerCall's faults: what a browser journey's
    // server error entries hold for the run's invariants. One a :catch of the routine handled
    // is marked `caught: true`, as createFaultSink in @lowdefy/test-utils marks it. A forced
    // failure (a fail gate's) is no fault: the dev server's handleError records it on the data
    // session instead.
    const handleError = context.handleError;
    context.handleError = async (error, options) => {
      if (!isExpectedError(error) && !isForcedFailure(error)) {
        if (options?.caught === true) {
          error.caught = true;
        }
        faults.push(error);
      }
      return handleError(error, options);
    };
    // The detached CallApi calls the call makes, as answerCall's detached: taken and recorded, and
    // their targets never run, as on the build host. Sent over the dev server's /api/detached
    // route, a target would run on the server's own secrets and add its writes and outside calls
    // to the journey's data session, which a build run of the journey never sees. expect.calls
    // reads them the same on either host. A browser journey's detached calls are still sent.
    const detached = [];
    context.sendDetached = (callerContext, args) => {
      detached.push({ endpointId: args.endpointId, payload: serializer.copy(args.payload) });
    };
    return { context, detached, faults };
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
    let buildContext = null;
    if (match !== null) {
      ({ buildContext } = await buildPage(match.pageId));
    }
    counter.recordCall({ url: `${origin}/api/page/${matchedPath}`, method: 'GET' });
    const page = await getPageConfig(context, { path: matchedPath, urlQuery: urlQuery ?? {} });
    // The page route sends a page that does not exist, and one the caller may not open, to the
    // not-found page, as the browser and the build host do, so neither reveals which it was.
    if (['not_found', 'unauthorized'].includes(page.status) && matchedPath !== NOT_FOUND_PATH) {
      return readPageConfig({ path: NOT_FOUND_PATH, urlQuery: {}, user: pageUser });
    }
    if (page.status !== 'ok') {
      throw new Error(
        `Page "${pageId ?? matchedPath}" did not open: the page route answered "${page.status}".`
      );
    }
    const pageConfig = JSON.parse(JSON.stringify(page.pageConfig));
    // As the page route folds them in: the page's _js, as module text the headless actor evaluates
    // over the client map it loaded at its first journey, which holds no _js a later page build
    // added (journey-headless's readPageJsMap).
    const { jsEntries } = getPageJitEnrichment({ pageConfig, buildContext });
    if (!type.isUndefined(jsEntries)) {
      pageConfig._jsEntries = jsEntries;
    }
    return {
      matchedPath,
      pageConfig,
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
    if (kind === 'request') {
      // As the request route does: the page's request artifact is built before it is read. Built
      // before the call's context, so its stand-ins cover the secrets the request names.
      await buildPage(pageId);
    }
    const { context, detached, faults } = await createContext({
      callUser,
      method: 'POST',
      requestPath,
    });
    if (kind === 'request') {
      return answer({
        context,
        detached,
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
      detached,
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

  // A call `as: system`: the endpoint runs as POST /api/detached runs it for a cron or a system
  // dispatcher, through runDetachedEndpoint with a system principal, so there is no user and an
  // InternalApi endpoint is callable. In process, so the route's CRON_SECRET gate is not crossed.
  async function system({ endpointId, payload }) {
    const requestPath = `/api/detached/${endpointId}`;
    counter.recordCall({ url: `${origin}${requestPath}`, method: 'POST' });
    const parsed = parseRequestBody({ text: JSON.stringify({ payload }) });
    const { context, detached, faults } = await createContext({
      callUser: 'none',
      method: 'POST',
      requestPath,
    });
    return answer({
      context,
      detached,
      faults,
      run: (callContext) =>
        runDetachedEndpoint(callContext, {
          endpointId,
          payload: parsed.payload,
          principal: { system: true },
        }),
    });
  }

  // A webhook step: posted as the endpoints route runs a webhook endpoint, through
  // runWebhookEndpoint with no caller, so its verify gate runs against rawBody. Answers what the
  // route sends, { status, body, contentType, faults, detached, rid }, as @lowdefy/test-utils'
  // callWebhook does: rid is the call's request id, by which a forced failure's message is read.
  async function webhook({ endpointId, headers, query, rawBody }) {
    const requestPath = `/api/endpoints/${endpointId}`;
    counter.recordCall({ url: `${origin}${requestPath}`, method: 'POST' });
    const { context, detached, faults } = await createContext({
      callUser: 'none',
      method: 'POST',
      requestPath,
    });
    try {
      const sent = await runWebhookEndpoint(context, { endpointId, headers, query, rawBody });
      if (sent.contentType === 'text/plain') {
        return {
          status: sent.status,
          body: sent.body,
          contentType: 'text/plain',
          faults,
          detached,
          rid: context.rid,
        };
      }
      return {
        status: sent.status,
        body: JSON.parse(JSON.stringify(sent.body)),
        contentType: 'application/json',
        faults,
        detached,
        rid: context.rid,
      };
    } catch (error) {
      const { body, status } = await answerError({ context, detached, error, faults });
      return { status, body, contentType: 'application/json', faults, detached, rid: context.rid };
    }
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
  // A build artifact by its path in the dev build, read fresh as the docs routes read it. Pages are
  // built on demand: runJourneyHeadless builds the ones a journey's steps name before it runs.
  function readArtifact(name) {
    return readBuildArtifact({ name, deserialize: true });
  }

  return createHeadlessHost({
    call,
    // The data session belongs to the journey run, which closes it (runJourneyHeadless).
    close: async () => {},
    connections: await readConnectionPlugins(),
    dataSetName: dataSet?.name ?? null,
    dataSession: session?.session ?? null,
    errorSink: createErrorSink(),
    findDocuments,
    // The plugins are imported once; the _js map is read as the file is now, so app events' _js a
    // config rebuild changed resolves without a restart (readClientJsMap). A page's own _js comes
    // with its config (readPageConfig).
    loadClientPlugins: async () => {
      clientPlugins = clientPlugins ?? loadClientPlugins({ buildDirectory });
      const plugins = await clientPlugins;
      return {
        ...plugins,
        jsMap: readClientJsMap({ buildDirectory, fallback: plugins.jsMap }),
      };
    },
    readArtifact,
    readPageConfig,
    resolveUser,
    rootConfig,
    system,
    userNames: Object.keys(users),
    webhook,
  });
}

export default createDevServerHost;
