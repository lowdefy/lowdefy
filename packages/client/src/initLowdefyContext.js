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

import { translate } from '@lowdefy/helpers';

import createCallAPI from './createCallAPI.js';
import createAuthMethods from './auth/createAuthMethods.js';
import createCallRequest from './createCallRequest.js';
import createWebSocketClient from './websocket/createWebSocketClient.js';
import createIcon from './createIcon.js';
import createShortcutBadge from './createShortcutBadge.js';
import createLinkComponent from './createLinkComponent.js';
import createHandleError from './createHandleError.js';
import createJourneyRecorder from './journey/createJourneyRecorder.js';
import { createBrowserLogger } from '@lowdefy/logger/browser';
import setupLink from './setupLink.js';

function initLowdefyContext({ auth, Components, config, lowdefy, router, stage, types, window }) {
  if (!lowdefy._internal?.initialised) {
    lowdefy._internal = {
      actions: types.actions,
      blockComponents: types.blocks,
      blockMetas: types.blockMetas ?? {},
      components: {
        Icon: createIcon(types.icons),
        ShortcutBadge: createShortcutBadge(lowdefy),
      },
      displayMessage: ({ content }) => {
        console.log(content);
        return () => undefined;
      },
      globals: {
        document: window.document,
        fetch: window.fetch,
        window,
      },
      initialised: true,
      link: () => undefined,
      operators: types.operators,
      progress: {
        state: {
          progress: 0,
        },
        dispatch: () => undefined,
      },
      router,
    };
    lowdefy.apiResponses = {};
    lowdefy.basePath = router.basePath;
    lowdefy.contexts = {};
    lowdefy.inputs = {};
    lowdefy.lowdefyApp = config.rootConfig.lowdefyApp;
    lowdefy.lowdefyGlobal = config.rootConfig.lowdefyGlobal;
    lowdefy.theme = config.rootConfig.theme ?? {};

    lowdefy._internal.callAPI = createCallAPI(lowdefy);
    lowdefy._internal.auth = createAuthMethods(lowdefy, auth);
    lowdefy._internal.callRequest = createCallRequest(lowdefy);
    lowdefy._internal.websocketClient = createWebSocketClient(lowdefy);
    lowdefy._internal.components.Link = createLinkComponent(lowdefy, Components.Link);
    lowdefy._internal.link = setupLink(lowdefy);
    lowdefy._internal.translate = (key, values) => translate({ key, values, i18n: lowdefy.i18n });
    lowdefy._internal.logger = createBrowserLogger();
    lowdefy._internal.handleError = createHandleError(lowdefy);
    lowdefy._internal.components.handleError = lowdefy._internal.handleError;

    // The journey recorder reads the same `stage` that decides whether
    // window.lowdefy exists: values only ever reach a trace event in dev, and
    // that is a structural property of the client build, not a server flag.
    // Undefined when journeys are off or this session was not sampled - the
    // engine then does no journey bookkeeping at all.
    lowdefy.recordJourneyEvent = createJourneyRecorder({
      basePath: router.basePath,
      config: lowdefy.journeys,
      stage,
      window,
    });

    if (stage === 'dev' || stage === 'e2e') {
      // Engine evaluation counters, off until something asks for them: the
      // engine allocates them per context only while lowdefy.perf is true, so
      // a normal dev session pays nothing. startPerf switches counting on for
      // the contexts already built and for every context built after, and a
      // second call is how a measurement resets between phases. The dev
      // server's lowdefy_measure_page drives both from a headless tab.
      lowdefy.startPerf = () => {
        lowdefy.perf = true;
        Object.values(lowdefy.contexts).forEach((context) => context._internal.enablePerf());
      };
      lowdefy.readPerf = () =>
        Object.keys(lowdefy.contexts)
          .filter((id) => lowdefy.contexts[id]._internal.perf)
          .map((id) => ({
            id,
            blocks: Object.keys(lowdefy.contexts[id]._internal.RootSlots.map).length,
            ...lowdefy.contexts[id]._internal.perf.snapshot(),
          }));
      window.lowdefy = lowdefy;
    }
  }

  lowdefy.home = config.rootConfig.home || {};
  lowdefy.menus = config.rootConfig.menus;
  lowdefy.pageId = config.pageConfig.pageId;
  lowdefy.user = auth?.user ?? null;

  return lowdefy;
}

export default initLowdefyContext;
