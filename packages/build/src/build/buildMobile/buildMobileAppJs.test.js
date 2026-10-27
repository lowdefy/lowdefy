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

import { expect, test } from 'vitest';
import buildJs from '../full/buildJs.js';
import buildMobileAppJs from './buildMobileAppJs.js';
import testContext from '../../test-utils/testContext.js';

function createEvents() {
  return {
    onInit: [{ id: 'set', type: 'SetGlobal', params: { ready: { _js: 'return 1;' } } }],
  };
}

test('buildMobileAppJs gives a mobile app the client _js of mobile.events as module text', () => {
  const context = testContext();
  const components = { events: {}, mobile: { events: createEvents(), pages: [] }, pages: [] };
  buildMobileAppJs({ components, context });
  expect(context.mobileAppJsEntries).toContain(
    "'tjmrJIhufQzEpj/iGu5AumDcrBQ=': ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, pathParams, request, state, urlQuery, user }) => { return 1; },"
  );
});

test('buildMobileAppJs replaces the _js source in mobile.events with its hash', () => {
  const context = testContext();
  const components = { events: {}, mobile: { events: createEvents(), pages: [] }, pages: [] };
  buildMobileAppJs({ components, context });
  const hash = components.mobile.events.onInit[0].params.ready._js;
  expect(hash).toBe('tjmrJIhufQzEpj/iGu5AumDcrBQ=');
  expect(context.mobileAppJsEntries).toContain(`'${hash}':`);
});

test('buildMobileAppJs keeps the _js of mobile.events out of the web module', () => {
  const context = testContext();
  const components = { events: {}, mobile: { events: createEvents(), pages: [] }, pages: [] };
  buildMobileAppJs({ components, context });
  buildJs({ components, context });
  expect(context.jsMap.client).toEqual({});
});

test('buildMobileAppJs leaves the web app events _js to the web module', () => {
  const context = testContext();
  const components = { events: createEvents(), mobile: { events: {}, pages: [] }, pages: [] };
  buildMobileAppJs({ components, context });
  buildJs({ components, context });
  expect(context.mobileAppJsEntries).toBeNull();
  expect(Object.keys(context.jsMap.client)).toEqual(['tjmrJIhufQzEpj/iGu5AumDcrBQ=']);
});

test('buildMobileAppJs gives null for an app without a mobile key', () => {
  const context = testContext();
  buildMobileAppJs({ components: { events: createEvents(), pages: [] }, context });
  expect(context.mobileAppJsEntries).toBeNull();
});
