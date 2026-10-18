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

import buildJs from '../full/buildJs.js';
import buildMobileAppJs from './buildMobileAppJs.js';
import testContext from '../../test-utils/testContext.js';

const events = {
  onInit: [{ id: 'set', type: 'SetGlobal', params: { ready: { _js: 'return 1;' } } }],
};

test('buildMobileAppJs gives a mobile app its app events client _js as module text', () => {
  const context = testContext();
  const components = { events, mobile: { pages: [] }, pages: [] };
  buildMobileAppJs({ components, context });
  expect(context.mobileAppJsEntries).toContain(
    "'tjmrJIhufQzEpj/iGu5AumDcrBQ=': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, pathParams, request, state, urlQuery, user }) => { return 1; },"
  );
});

test('buildMobileAppJs uses the hashes buildJs writes into the app events', () => {
  const context = testContext();
  const components = { events, mobile: { pages: [] }, pages: [] };
  buildMobileAppJs({ components, context });
  buildJs({ components, context });
  const hash = components.events.onInit[0].params.ready._js;
  expect(context.mobileAppJsEntries).toContain(`'${hash}':`);
});

test('buildMobileAppJs gives null for an app without a mobile key or app _js', () => {
  const webContext = testContext();
  buildMobileAppJs({ components: { events, pages: [] }, context: webContext });
  expect(webContext.mobileAppJsEntries).toBeNull();
  const plainContext = testContext();
  buildMobileAppJs({
    components: { events: { onInit: [] }, mobile: { pages: [] }, pages: [] },
    context: plainContext,
  });
  expect(plainContext.mobileAppJsEntries).toBeNull();
});
