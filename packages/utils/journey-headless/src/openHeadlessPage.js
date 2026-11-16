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

import createHeadlessActor from './createHeadlessActor.js';

// Opens a page on the client engine in Node, as the web client opens it in a browser, with no
// DOM and no React (createHeadlessActor): the page and root config as the page route sends them,
// the build's own client plugins, and requests and endpoint calls run in process by the host as
// `user` (a data set user name, a user object, or "none"; the host's user by default). Resolves
// once the app's and the page's onInit and every block's onMount have run.
//
// Returns { actor, calls, context, lowdefy, navigations }: the actor that opened it, every request
// and endpoint call the page made (kind, pageId, requestId or endpointId, blockId, actionId,
// payload, status, success, response, error), the page's engine context, the lowdefy object, and
// every navigation the page asked the router for.
async function openHeadlessPage({ host, pageId, pathParams, stepTimeout = 5000, urlQuery, user }) {
  const actor = createHeadlessActor({
    host,
    name: 'main',
    onTrace: () => undefined,
    plugins: await host.loadClientPlugins(),
    stepTimeout,
    user,
  });
  await actor.load({ pageId, pathParams, urlQuery });
  return {
    actor,
    calls: actor.calls,
    context: actor.page.context,
    lowdefy: actor.getLowdefy(),
    navigations: actor.navigations,
  };
}

export default openHeadlessPage;
