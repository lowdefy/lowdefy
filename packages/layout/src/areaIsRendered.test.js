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

import areaIsRendered from './areaIsRendered.js';
import blockLayoutIsRendered from './blockLayoutIsRendered.js';

test('areaIsRendered is false for a slot of plain blocks with no arrangement', () => {
  expect(
    areaIsRendered({
      area: {},
      areaKey: 'content',
      blockLayouts: [{}, {}],
      className: '',
      layout: {},
      style: {},
    })
  ).toBe(false);
});

test('areaIsRendered is true when the slot is arranged', () => {
  expect(
    areaIsRendered({ area: { gap: 16 }, areaKey: 'content', blockLayouts: [{}], layout: {} })
  ).toBe(true);
});

test('areaIsRendered is true when the container layout arranges its content slot', () => {
  expect(
    areaIsRendered({
      area: {},
      areaKey: 'content',
      blockLayouts: [{}],
      layout: { direction: 'column' },
    })
  ).toBe(true);
});

test('areaIsRendered is true when one block in the slot is laid out, because a column needs its row', () => {
  expect(
    areaIsRendered({
      area: {},
      areaKey: 'content',
      blockLayouts: [{}, { span: 12 }, undefined],
      layout: {},
    })
  ).toBe(true);
});

test('areaIsRendered is true when the block passes a content style into the slot', () => {
  expect(
    areaIsRendered({
      area: {},
      areaKey: 'content',
      blockLayouts: [{}],
      layout: {},
      style: { display: 'contents' },
    })
  ).toBe(true);
});

test('areaIsRendered is true when the slot has a class of its own', () => {
  expect(
    areaIsRendered({
      area: {},
      areaKey: 'content',
      blockLayouts: [{}],
      className: 'p-4',
      layout: {},
    })
  ).toBe(true);
});

test('blockLayoutIsRendered wraps every block in a rendered area, laid out or not', () => {
  expect(blockLayoutIsRendered({ inArea: true, layout: {} })).toBe(true);
  expect(blockLayoutIsRendered({ inArea: false, layout: {} })).toBe(false);
  expect(blockLayoutIsRendered({ inArea: undefined, layout: {} })).toBe(false);
});

test('blockLayoutIsRendered wraps a laid out block outside any area', () => {
  expect(blockLayoutIsRendered({ inArea: false, layout: { span: 12 } })).toBe(true);
});
