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

import createFileDependencyMap from './createFileDependencyMap.js';

test('createFileDependencyMap maps files to pages with string refs', () => {
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        rawContent: {
          blocks: { '~shallow': true, _ref: 'pages/home/blocks.yaml' },
        },
      },
    ],
  ]);
  const map = createFileDependencyMap({ pageRegistry, refMap: {} });
  expect(map.get('pages/home/blocks.yaml')).toEqual(new Set(['home']));
});

test('createFileDependencyMap maps files to pages with object refs', () => {
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        rawContent: {
          blocks: { '~shallow': true, _ref: { path: 'pages/home/blocks.yaml', vars: {} } },
        },
      },
    ],
  ]);
  const map = createFileDependencyMap({ pageRegistry, refMap: {} });
  expect(map.get('pages/home/blocks.yaml')).toEqual(new Set(['home']));
});

test('createFileDependencyMap maps shared files to multiple pages', () => {
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        rawContent: {
          blocks: { '~shallow': true, _ref: 'shared/layout.yaml' },
        },
      },
    ],
    [
      'dashboard',
      {
        pageId: 'dashboard',
        rawContent: {
          blocks: { '~shallow': true, _ref: 'shared/layout.yaml' },
        },
      },
    ],
  ]);
  const map = createFileDependencyMap({ pageRegistry, refMap: {} });
  expect(map.get('shared/layout.yaml')).toEqual(new Set(['home', 'dashboard']));
});

test('createFileDependencyMap handles multiple refs per page', () => {
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        rawContent: {
          blocks: { '~shallow': true, _ref: 'pages/home/blocks.yaml' },
          events: { '~shallow': true, _ref: 'pages/home/events.yaml' },
          requests: [{ '~shallow': true, _ref: 'pages/home/requests.yaml' }],
        },
      },
    ],
  ]);
  const map = createFileDependencyMap({ pageRegistry, refMap: {} });
  expect(map.get('pages/home/blocks.yaml')).toEqual(new Set(['home']));
  expect(map.get('pages/home/events.yaml')).toEqual(new Set(['home']));
  expect(map.get('pages/home/requests.yaml')).toEqual(new Set(['home']));
});

test('createFileDependencyMap returns empty map for empty registry', () => {
  const map = createFileDependencyMap({ pageRegistry: new Map(), refMap: {} });
  expect(map.size).toBe(0);
});

test('createFileDependencyMap handles pages with no shallow refs', () => {
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        rawContent: {
          blocks: [{ id: 'block1', type: 'TextInput' }],
        },
      },
    ],
  ]);
  const map = createFileDependencyMap({ pageRegistry, refMap: {} });
  expect(map.size).toBe(0);
});
