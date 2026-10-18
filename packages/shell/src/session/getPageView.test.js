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

import getPageView from './getPageView.js';
import { createPage, createRoot, shell } from '../test/fixtures.js';

const pageIndex = [
  { path: 'today', pageId: 'today', hash: 'h1', typesKey: 'carried' },
  { path: 'map', pageId: 'map', hash: 'h2', typesKey: 'newBlock' },
  { path: 'report', pageId: 'report', hash: 'h3', typesKey: 'nextMajor' },
  { path: 'jobs/{job_id}', pageId: 'job', hash: 'h4', typesKey: 'carried' },
];

function createState({ root = createRoot({ pageIndex }), pages } = {}) {
  return {
    root,
    pages: pages ?? {
      today: { hash: 'h1', pageConfig: createPage('today') },
      map: { hash: 'h2', pageConfig: createPage('map') },
      report: { hash: 'h3', pageConfig: createPage('report') },
      job: { hash: 'h4', pageConfig: createPage('job') },
    },
  };
}

describe('the type check', () => {
  test('a page needing a block the shell lacks shows the update screen, other pages open', () => {
    const state = createState();
    expect(getPageView({ path: 'map', shell, state })).toEqual({
      view: 'update',
      reason: 'types',
      missing: [{ category: 'blocks', type: 'Map', package: '@lowdefy/blocks-native', version: 7 }],
    });
    expect(getPageView({ path: 'today', shell, state })).toEqual(
      expect.objectContaining({ view: 'page', pathParams: {} })
    );
  });

  test('a type from another major version of its package is missing', () => {
    expect(getPageView({ path: 'report', shell, state: createState() })).toEqual(
      expect.objectContaining({
        view: 'update',
        missing: [
          { category: 'blocks', type: 'Title', package: '@lowdefy/blocks-native', version: 8 },
        ],
      })
    );
  });

  test('a page is checked before it is fetched', () => {
    expect(getPageView({ path: 'map', shell, state: createState({ pages: {} }) }).view).toBe(
      'update'
    );
  });

  test('a dev page (no type set) is checked by the types its config uses once it arrives', () => {
    const root = createRoot({
      pageIndex: [
        { path: 'today', pageId: 'today' },
        { path: 'map', pageId: 'map' },
      ],
      typeSets: {},
    });
    const mapPage = createPage('map');
    mapPage.slots.content.blocks.push({
      id: 'block:map:m:0',
      blockId: 'm',
      type: 'Map',
      events: { onClick: { try: [{ id: 'a', type: 'Vibrate' }], catch: [] } },
    });
    const state = createState({
      root,
      pages: { today: { pageConfig: createPage('today') }, map: { pageConfig: mapPage } },
    });
    expect(getPageView({ path: 'today', shell, state }).view).toBe('page');
    expect(getPageView({ path: 'map', shell, state }).missing).toEqual([
      { category: 'blocks', type: 'Map' },
      { category: 'actions', type: 'Vibrate' },
    ]);
    expect(getPageView({ path: 'map', shell, state: createState({ root, pages: {} }) }).view).toBe(
      'loading'
    );
  });
});

describe('minShellVersion', () => {
  test('a shell older than minShellVersion shows the update screen for every page', () => {
    const state = createState({ root: createRoot({ pageIndex, minShellVersion: '7.5.0' }) });
    ['today', 'jobs/12', 'nowhere'].forEach((path) => {
      expect(getPageView({ path, shell, state })).toEqual({
        view: 'update',
        reason: 'minShellVersion',
      });
    });
  });

  test('a shell at or above minShellVersion opens pages', () => {
    ['7.4.0', '7.3.9', '6.0.0'].forEach((minShellVersion) => {
      const state = createState({ root: createRoot({ pageIndex, minShellVersion }) });
      expect(getPageView({ path: 'today', shell, state }).view).toBe('page');
    });
  });
});

test('a path with params opens its page with the values from the path', () => {
  expect(getPageView({ path: 'jobs/a b', shell, state: createState() })).toEqual(
    expect.objectContaining({ view: 'page', pathParams: { job_id: 'a b' } })
  );
});

test('a page not yet cached is loading', () => {
  expect(getPageView({ path: 'jobs/12', shell, state: createState({ pages: {} }) })).toEqual({
    view: 'loading',
    entry: pageIndex[3],
    pathParams: { job_id: '12' },
  });
});

test('a path no mobile page has is another page', () => {
  expect(getPageView({ path: 'reports', shell, state: createState() })).toEqual({
    view: 'other',
    path: 'reports',
  });
});
