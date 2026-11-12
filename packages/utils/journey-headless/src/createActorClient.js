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

import { createLowdefyCore } from '@lowdefy/client-core';
import { createLink, getAppContext, getTrace } from '@lowdefy/engine';
import { ConfigError } from '@lowdefy/errors';

import browserOnlyActions from './browserOnlyActions.js';
import createBrowserActionStub from './createBrowserActionStub.js';
import createNodeClientHost from './createNodeClientHost.js';
import createNodeGlobals from './createNodeGlobals.js';
import createPageCalls from './createPageCalls.js';
import createSinkLogger from './createSinkLogger.js';

// One page load's lowdefy object for an actor, as the web client builds it in a browser tab
// (initLowdefyContext), with no DOM and no React: client-core on a Node host, the build's client
// plugins, requests and endpoint calls run in process by the host as the actor's user, and the
// web client's hooks done here:
// - link: a page link asks the router, which the actor follows to the next page; a link out of
//   the app is recorded as leaving it.
// - displayMessage: each message is recorded.
// - handleError and the logger: errors go to the host's error sink.
// - an action only a browser can carry out is a stub that tells onBrowserOnly its type.
// Every completed event's trace payload goes to onTrace, as a browser journey's step observer
// reads them. Returns { globals, lowdefy, appContext }.
function createActorClient({ actor, host, onBrowserOnly, onTrace, plugins, rootConfig, router }) {
  const globals = createNodeGlobals({ path: '', urlQuery: {} });
  const lowdefy = {};
  createLowdefyCore({
    apiBase: '',
    auth: { authConfig: {} },
    basePath: '',
    host: createNodeClientHost({ globals, router }),
    lowdefy,
    rootConfig,
    types: {
      actions: Object.fromEntries(
        Object.entries(plugins.actions).map(([actionType, action]) => [
          actionType,
          browserOnlyActions.has(actionType)
            ? createBrowserActionStub({ actionType, onCall: onBrowserOnly })
            : action,
        ])
      ),
      blockMetas: plugins.blockMetas,
      blocks: {},
      operators: plugins.operators,
    },
  });
  const pageCalls = createPageCalls({ calls: actor.calls, host, user: actor.user });
  lowdefy._internal.callAPI = pageCalls.callAPI;
  lowdefy._internal.callRequest = pageCalls.callRequest;
  lowdefy._internal.handleError = async (error) => {
    host.errorSink.add({ error, source: 'client' });
  };
  lowdefy._internal.logger = createSinkLogger({ errorSink: host.errorSink });
  lowdefy._internal.displayMessage = ({ content, status }) => {
    actor.messages.push({ content, status: status ?? 'success' });
    return () => undefined;
  };
  lowdefy._internal.link = createLink({
    backLink: () => router.back(),
    disabledLink: () => undefined,
    lowdefy,
    newOriginLink: ({ href, query, url }) => {
      actor.leftApp = href ?? `${url}${query ? `?${query}` : ''}`;
    },
    noLink: () => {
      throw new ConfigError('Invalid Link: no target resolved.');
    },
    sameOriginLink: ({ pathname, query, replace, setInput }) => {
      setInput();
      const navigate = replace ? router.replace : router.push;
      return navigate({ pathname, query });
    },
  });
  getTrace(lowdefy).subscribe(onTrace);
  const appContext = getAppContext({
    events: rootConfig.events,
    jsMap: plugins.jsMap,
    lowdefy,
  });
  return { appContext, globals, lowdefy };
}

export default createActorClient;
