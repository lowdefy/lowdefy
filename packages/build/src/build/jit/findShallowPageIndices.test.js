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

import findShallowPageIndices from './findShallowPageIndices.js';

test('findShallowPageIndices detects ~shallow marker in top-level content key', () => {
  const pages = [
    { id: 'home', blocks: { '~shallow': true, _ref: 'home.yaml' } },
    { id: 'about', blocks: [{ id: 'b1', type: 'Text' }] },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set([0]));
});

test('findShallowPageIndices detects ~shallow marker nested in arrays', () => {
  const pages = [
    {
      id: 'page1',
      blocks: [
        { id: 'b1', type: 'Box', blocks: [{ '~shallow': true, _ref: 'nested.yaml' }] },
      ],
    },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set([0]));
});

test('findShallowPageIndices detects ~shallow in different content keys', () => {
  const pages = [
    { id: 'p1', events: { onClick: { '~shallow': true, _ref: 'events.yaml' } } },
    { id: 'p2', requests: [{ '~shallow': true, _ref: 'req.yaml' }] },
    { id: 'p3', areas: { content: { '~shallow': true, _ref: 'area.yaml' } } },
    { id: 'p4', layout: { '~shallow': true, _ref: 'layout.yaml' } },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set([0, 1, 2, 3]));
});

test('findShallowPageIndices returns empty set when no markers present', () => {
  const pages = [
    { id: 'home', blocks: [{ id: 'b1', type: 'Text' }] },
    { id: 'about', blocks: [{ id: 'b2', type: 'Box' }] },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set());
});

test('findShallowPageIndices returns empty set for empty pages array', () => {
  expect(findShallowPageIndices([])).toEqual(new Set());
});

test('findShallowPageIndices returns empty set for null pages', () => {
  expect(findShallowPageIndices(null)).toEqual(new Set());
});

test('findShallowPageIndices returns empty set for undefined pages', () => {
  expect(findShallowPageIndices(undefined)).toEqual(new Set());
});

test('findShallowPageIndices ignores ~shallow in non-content keys', () => {
  const pages = [
    { id: 'home', auth: { '~shallow': true }, type: 'PageHeaderMenu' },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set());
});

test('findShallowPageIndices handles pages with no content keys', () => {
  const pages = [
    { id: 'home', type: 'PageHeaderMenu' },
    { id: 'about', type: 'PageSiderMenu' },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set());
});

test('findShallowPageIndices detects marker deeply nested in objects', () => {
  const pages = [
    {
      id: 'deep',
      blocks: [
        {
          id: 'b1',
          type: 'Box',
          areas: {
            content: {
              blocks: [
                { id: 'b2', type: 'Card', blocks: [{ '~shallow': true, _ref: 'deep.yaml' }] },
              ],
            },
          },
        },
      ],
    },
  ];
  const indices = findShallowPageIndices(pages);
  expect(indices).toEqual(new Set([0]));
});
