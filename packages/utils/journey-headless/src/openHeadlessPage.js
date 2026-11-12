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

import { createLowdefyCore, updateLowdefyPage } from '@lowdefy/client-core';
import getContext, { getAppContext } from '@lowdefy/engine';
import { serializer } from '@lowdefy/helpers';

import createNodeClientHost from './createNodeClientHost.js';
import createNodeGlobals from './createNodeGlobals.js';
import createPageCalls from './createPageCalls.js';
import createRecordingRouter from './createRecordingRouter.js';
import createSinkLogger from './createSinkLogger.js';
import fireMountEvents from './fireMountEvents.js';

// Opens a page on the client engine in Node, as the web client opens it in a browser, with no
// DOM and no React: the page and root config as the page route sends them, the build's own client
// plugins, and requests and endpoint calls run in process by the host as `user` (a data set user
// name, a user object, or "none"; the host's user by default). Then, as the client's Context and
// Block components do: the app's onInit and the page's onInit, the app's and the page's
// onInitAsync (not waited for), and every block's onMount in mount order.
//
// Returns { context, lowdefy, calls, navigations }: the page's engine context, the lowdefy
// object, every request and endpoint call the page made (kind, pageId, requestId or endpointId,
// blockId, actionId, payload, status, success, response, error), and every navigation the page
// asked the router for.
async function openHeadlessPage({ host, pageId, pathParams, urlQuery, user }) {
  const page = await host.readPageConfig({ pageId, pathParams, urlQuery, user });
  const plugins = await host.loadClientPlugins();
  const config = serializer.deserialize({
    pageConfig: page.pageConfig,
    rootConfig: host.rootConfig,
  });
  const router = createRecordingRouter();
  const calls = [];
  const lowdefy = {};
  createLowdefyCore({
    apiBase: '',
    auth: { authConfig: {} },
    basePath: '',
    host: createNodeClientHost({
      globals: createNodeGlobals({ path: page.matchedPath, urlQuery }),
      router,
    }),
    lowdefy,
    rootConfig: config.rootConfig,
    types: {
      actions: plugins.actions,
      blockMetas: plugins.blockMetas,
      blocks: {},
      operators: plugins.operators,
    },
  });
  const pageCalls = createPageCalls({ calls, host, user });
  lowdefy._internal.callAPI = pageCalls.callAPI;
  lowdefy._internal.callRequest = pageCalls.callRequest;
  lowdefy._internal.handleError = async (error) => {
    host.errorSink.add({ error, source: 'client' });
  };
  lowdefy._internal.logger = createSinkLogger({ errorSink: host.errorSink });
  updateLowdefyPage({
    config,
    lowdefy,
    matchedPath: page.matchedPath,
    pathParams: page.pathParams,
    user: host.resolveUser(user),
  });

  const progress = () => undefined;
  const appContext = getAppContext({
    events: config.rootConfig.events,
    jsMap: plugins.jsMap,
    lowdefy,
  });
  const context = getContext({
    config: config.pageConfig,
    jsMap: plugins.jsMap,
    lowdefy,
    pathParams: page.pathParams,
  });
  await appContext._internal.runOnInit(progress);
  appContext._internal.runOnInitAsync(progress);
  await context._internal.runOnInit(progress);
  context._internal.runOnInitAsync(progress);
  await fireMountEvents({ context });
  return { calls, context, lowdefy, navigations: router.navigations };
}

export default openHeadlessPage;
