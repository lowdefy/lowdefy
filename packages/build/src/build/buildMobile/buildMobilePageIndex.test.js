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
import buildMobilePageIndex from './buildMobilePageIndex.js';
import createCounter from '../../utils/createCounter.js';
import testContext from '../../test-utils/testContext.js';

function createPageCounters({ actions = [], blocks = [], operators = [] }) {
  const pageCounters = {
    actions: createCounter(),
    blocks: createCounter(),
    operators: createCounter(),
  };
  actions.forEach((name) => pageCounters.actions.increment(name));
  blocks.forEach((name) => pageCounters.blocks.increment(name));
  operators.forEach((name) => pageCounters.operators.increment(name));
  return pageCounters;
}

function createContext() {
  const context = testContext();
  context.warnings = [];
  context.routes = [
    { pageId: 'home', path: 'home' },
    { pageId: 'job', path: 'jobs/{job_id}' },
    { pageId: 'about', path: 'about' },
  ];
  context.typesMobile = {
    actions: { Link: { package: '@lowdefy/actions-core', version: '^7.1.0' } },
    blocks: {
      Box: { package: '@lowdefy/blocks-native', version: '7.2.0' },
      Title: { package: '@lowdefy/blocks-native', version: '7.2.0' },
    },
    operators: {
      client: {
        _not: { package: '@lowdefy/operators-js', version: 'workspace:*' },
        _type: { package: '@lowdefy/operators-js', version: 'workspace:*' },
      },
    },
  };
  context.pageTypeCounters.set('job', createPageCounters({ blocks: ['Box', 'Title'] }));
  context.pageTypeCounters.set(
    'about',
    createPageCounters({ actions: ['Link'], blocks: ['Box'], operators: ['_unknown_op'] })
  );
  context.mobileAppTypeCounters = createPageCounters({});
  return context;
}

const components = {
  pages: [
    { id: 'page:home', pageId: 'home', target: 'web' },
    { id: 'page:job', pageId: 'job', target: 'mobile' },
    { id: 'page:about', pageId: 'about', target: 'both' },
  ],
};

test('buildMobilePageIndex lists mobile and shared pages with path, hash and typesKey', () => {
  const context = createContext();
  buildMobilePageIndex({ components, context });
  expect(context.mobilePageIndex.map(({ path, pageId }) => ({ path, pageId }))).toEqual([
    { path: 'jobs/{job_id}', pageId: 'job' },
    { path: 'about', pageId: 'about' },
  ]);
  context.mobilePageIndex.forEach((entry) => {
    expect(entry.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(context.mobileTypeSets[entry.typesKey]).toBeDefined();
  });
});

test('buildMobilePageIndex type sets name each type with its package and major version', () => {
  const context = createContext();
  buildMobilePageIndex({ components, context });
  const aboutKey = context.mobilePageIndex[1].typesKey;
  expect(context.mobileTypeSets[aboutKey]).toEqual({
    actions: [{ type: 'Link', package: '@lowdefy/actions-core', version: 7 }],
    blocks: [{ type: 'Box', package: '@lowdefy/blocks-native', version: 7 }],
    operators: [
      { type: '_not', package: '@lowdefy/operators-js', version: null },
      { type: '_type', package: '@lowdefy/operators-js', version: null },
    ],
  });
});

test('buildMobilePageIndex gives pages with the same type set the same typesKey', () => {
  const context = createContext();
  context.pageTypeCounters.set('about', createPageCounters({ blocks: ['Title', 'Box'] }));
  buildMobilePageIndex({ components, context });
  expect(context.mobilePageIndex[0].typesKey).toEqual(context.mobilePageIndex[1].typesKey);
  expect(Object.keys(context.mobileTypeSets)).toHaveLength(1);
});

test('buildMobilePageIndex adds the mobile.events types to every page type set', () => {
  const context = createContext();
  context.mobileAppTypeCounters = createPageCounters({ actions: ['Link'] });
  buildMobilePageIndex({ components, context });
  context.mobilePageIndex.forEach((entry) => {
    expect(context.mobileTypeSets[entry.typesKey].actions).toEqual([
      { type: 'Link', package: '@lowdefy/actions-core', version: 7 },
    ]);
  });
});

test('buildMobilePageIndex warns when mobile pages total over 1 MB of JSON', () => {
  const context = createContext();
  const bigPage = {
    id: 'page:job',
    pageId: 'job',
    target: 'mobile',
    properties: { text: 'x'.repeat(1024 * 1024) },
  };
  buildMobilePageIndex({ components: { pages: [bigPage] }, context });
  expect(context.warnings.map((warning) => warning.message)).toEqual([
    "Mobile pages total 1.0 MB of JSON. A shell fetches every mobile page a user may open, so keep a mobile app's pages under 500 KB.",
  ]);
});

test('buildMobilePageIndex writes empty artifacts for an app without mobile pages', () => {
  const context = createContext();
  buildMobilePageIndex({ components: { pages: [components.pages[0]] }, context });
  expect(context.mobilePageIndex).toEqual([]);
  expect(context.mobileTypeSets).toEqual({});
});
