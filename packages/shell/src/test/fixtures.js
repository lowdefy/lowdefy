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

const typeManifest = {
  actions: {
    SetState: { package: '@lowdefy/actions-core', version: 7 },
  },
  blocks: {
    Box: { package: '@lowdefy/blocks-native', version: 7 },
    Screen: { package: '@lowdefy/blocks-native', version: 7 },
    Title: { package: '@lowdefy/blocks-native', version: 7 },
  },
  operators: {
    _state: { package: '@lowdefy/operators-js', version: 7 },
  },
};

const shell = { version: '7.4.0', typeManifest };

const typeSets = {
  carried: {
    actions: [{ type: 'SetState', package: '@lowdefy/actions-core', version: 7 }],
    blocks: [
      { type: 'Screen', package: '@lowdefy/blocks-native', version: 7 },
      { type: 'Title', package: '@lowdefy/blocks-native', version: 7 },
    ],
    operators: [{ type: '_state', package: '@lowdefy/operators-js', version: 7 }],
  },
  newBlock: {
    actions: [],
    blocks: [
      { type: 'Screen', package: '@lowdefy/blocks-native', version: 7 },
      { type: 'Map', package: '@lowdefy/blocks-native', version: 7 },
    ],
    operators: [],
  },
  nextMajor: {
    actions: [],
    blocks: [{ type: 'Title', package: '@lowdefy/blocks-native', version: 8 }],
    operators: [],
  },
};

function createPage(pageId, title = pageId) {
  return {
    id: `page:${pageId}`,
    pageId,
    blockId: pageId,
    type: 'Screen',
    properties: { title },
    slots: { content: { blocks: [{ id: `block:${pageId}:t:0`, blockId: 't', type: 'Title' }] } },
  };
}

function createRoot({ buildId = 'build-1', minShellVersion = null, pageIndex, ...rest } = {}) {
  return {
    events: {},
    homePageId: 'today',
    lowdefyApp: { slug: 'field', buildId },
    lowdefyGlobal: {},
    menus: {
      tabs: [
        { pageId: 'today', title: 'Today' },
        { pageId: 'jobs', title: 'Jobs' },
      ],
    },
    minShellVersion,
    pageIndex: pageIndex ?? [
      { path: 'today', pageId: 'today', hash: 'h-today-1', typesKey: 'carried' },
      { path: 'jobs', pageId: 'jobs', hash: 'h-jobs-1', typesKey: 'carried' },
      { path: 'jobs/{job_id}', pageId: 'job', hash: 'h-job-1', typesKey: 'carried' },
    ],
    typeSets,
    theme: { light: {}, dark: {} },
    ...rest,
  };
}

function createPages(paths) {
  return Object.fromEntries(
    paths.map(([path, pageId, etag]) => [path, { pageConfig: createPage(pageId), etag }])
  );
}

export { createPage, createPages, createRoot, shell, typeManifest, typeSets };
