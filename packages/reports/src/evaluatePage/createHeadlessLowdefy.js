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

import {
  Request,
  Reset,
  SetGlobal,
  SetState,
  Throw,
  Validate,
  Wait,
} from '@lowdefy/actions-core/actions';
import { ConfigError } from '@lowdefy/errors';
import { translate, urlQuery } from '@lowdefy/helpers';

// The engine executes any action whose type resolves to a function on
// `lowdefy._internal.actions`. Reports run headless, so only these actions have
// a meaningful server-side effect. They map to the real actions-core
// implementations — every other action name is skipped (see createActionRegistry).
const SERVER_SAFE_ACTIONS = {
  Request,
  Reset,
  SetGlobal,
  SetState,
  Throw,
  Validate,
  Wait,
};

// Fixed print viewport for the report render — _media resolves deterministically
// to this size regardless of the invoker's device.
const PRINT_VIEWPORT = { innerWidth: 1200, innerHeight: 800 };

// One wording for the guard, raised both from the operator and by the caller's
// assertion so a scheduled render reports the same cause either way.
const userOnScheduleMessage = (pageId) =>
  `Page '${pageId}' uses _user and cannot be rendered on a schedule; pass explicit parameters via the schedule payload instead.`;

// An action registry that returns the real implementation for server-safe
// actions and a skip stub for everything else. The stub records the skipped
// action and resolves, so an init chain containing browser-only actions
// (ScrollTo, DisplayMessage, Link, CopyToClipboard, …) never fails the report.
// A Proxy — rather than an enumerated deny list — is used so every unknown
// action name skips uniformly; the engine's own "invalid action type" guard is
// intentionally bypassed for reports where skipping is the graceful behaviour.
function createActionRegistry({ warnings }) {
  const skipStubs = {};
  return new Proxy(SERVER_SAFE_ACTIONS, {
    get(target, actionType) {
      if (typeof actionType !== 'string') return undefined;
      if (Object.prototype.hasOwnProperty.call(target, actionType)) {
        return target[actionType];
      }
      if (!skipStubs[actionType]) {
        skipStubs[actionType] = ({ methods } = {}) => {
          warnings.push({ actionType, blockId: methods?.getBlockId?.() });
          return undefined;
        };
      }
      return skipStubs[actionType];
    },
  });
}

// Build the synthetic window: a fixed light-theme print viewport with a
// location derived from the server URL and the page being rendered, so
// `_media`, `_location` and `getUrlQuery` resolve deterministically.
function createWindow({ basePath, pageId, seedUrlQuery, serverUrl }) {
  const url = new URL(serverUrl ?? 'http://localhost');
  url.pathname = `/${[basePath, pageId].filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/');
  url.search = urlQuery.stringify(seedUrlQuery ?? {});
  return {
    ...PRINT_VIEWPORT,
    __lowdefy_isDark: false,
    location: {
      hash: url.hash,
      host: url.host,
      hostname: url.hostname,
      href: url.href,
      origin: url.origin,
      pathname: url.pathname,
      port: url.port,
      protocol: url.protocol,
      search: url.search,
    },
  };
}

// Wrap the injected callRequest so every in-flight request promise is tracked.
// The engine keeps only `loading` booleans (Requests.js), never the promises
// themselves, so this Set is the sole mechanism for draining outstanding
// requests after the init phases. `drainRequests` re-checks the Set after each
// await so requests triggered during the drain are also awaited.
function createTrackingCallRequest(callRequest) {
  const inFlight = new Set();

  const trackedCallRequest = (payload) => {
    let promise;
    try {
      promise = Promise.resolve(callRequest(payload));
    } catch (error) {
      promise = Promise.reject(error);
    }
    inFlight.add(promise);
    const remove = () => inFlight.delete(promise);
    promise.then(remove, remove);
    return promise;
  };

  const drainRequests = async () => {
    while (inFlight.size > 0) {
      await Promise.allSettled([...inFlight]);
    }
  };

  return { trackedCallRequest, drainRequests };
}

const silentLogger = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  log: () => undefined,
  warn: () => undefined,
};

/**
 * Build a fresh headless `lowdefy` context object for one report generation,
 * mirroring the shape the browser client assembles in
 * `packages/client/src/initLowdefyContext.js`. Everything the engine needs is
 * injected by the caller (the server) — no server package is imported here.
 *
 * Returns a handle: `{ lowdefy, pageConfig, jsMap, seed, warnings, drainRequests }`.
 * The factory owns the synthetic window (including `seed.urlQuery`); seeding
 * `lowdefy.inputs[pageId]` from `seed.input` and the context state from
 * `seed.state` is left to evaluatePage, which runs after `getContext` creates
 * those context-scoped structures.
 */
function createHeadlessLowdefy({
  pageConfig,
  lowdefyGlobal = {},
  user = null,
  operators,
  jsMap = {},
  blockMetas = {},
  callRequest,
  logger = silentLogger,
  serverUrl,
  basePath = '',
  home = {},
  menus = [],
  lowdefyApp = {},
  theme = {},
  i18n,
  seed = {},
  invocation = 'user',
}) {
  const pageId = pageConfig?.pageId ?? pageConfig?.id;
  const warnings = [];

  const window = createWindow({ basePath, pageId, seedUrlQuery: seed.urlQuery, serverUrl });

  // Copy the operator map so the caller's map is never mutated. On system
  // (scheduled) renders, swap _user for a fail-fast guard: only actual _user
  // evaluation trips it, never incidental access to the user object.
  //
  // The guard records the read as well as throwing, because throwing alone
  // cannot stop a render: the parser collects every error an operator raises
  // into its own `errors` array and substitutes null (webParser.js), so a
  // scheduled report would otherwise sail on and email a document with an empty
  // name where the user should be — the exact failure this guard exists to
  // prevent. `assertUserNotEvaluated` is what actually stops it, and the caller
  // asserts at each phase boundary so nothing external happens after the read.
  const resolvedOperators = { ...operators };
  let userEvaluated = false;
  if (invocation === 'system') {
    resolvedOperators._user = () => {
      userEvaluated = true;
      throw new ConfigError(userOnScheduleMessage(pageId));
    };
  }

  const assertUserNotEvaluated = () => {
    if (userEvaluated) throw new ConfigError(userOnScheduleMessage(pageId));
  };

  const { trackedCallRequest, drainRequests } = createTrackingCallRequest(callRequest);

  const lowdefy = {
    apiResponses: {},
    basePath,
    contexts: {},
    home,
    i18n,
    inputs: {},
    lowdefyApp,
    lowdefyGlobal,
    menus,
    pageId,
    theme,
    user,
    _internal: {
      actions: createActionRegistry({ warnings }),
      // The engine reads blockMetas[type].category — it never loads React
      // components — so blockComponents is an inert proxy.
      blockComponents: new Proxy({}, { get: () => ({}) }),
      blockMetas,
      callRequest: trackedCallRequest,
      components: {},
      displayMessage: () => () => undefined,
      globals: { document: undefined, fetch: globalThis.fetch, window },
      handleError: (error) => logger.error(error),
      initialised: true,
      link: () => undefined,
      logger,
      operators: resolvedOperators,
      translate: (key, values) => translate({ key, values, i18n }),
      updaters: {},
    },
  };

  // No React updaters register headless, so this is inert — but mirror the
  // client's implementation so a block render never hits an undefined callback.
  lowdefy._internal.updateBlock = (blockId) =>
    lowdefy._internal.updaters[blockId] && lowdefy._internal.updaters[blockId]();

  return {
    lowdefy,
    pageConfig,
    jsMap,
    seed,
    warnings,
    drainRequests,
    assertUserNotEvaluated,
  };
}

export default createHeadlessLowdefy;
