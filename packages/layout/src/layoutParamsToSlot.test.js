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

import layoutParamsToSlot from './layoutParamsToSlot.js';

test('empty slot and layout', () => {
  const layout = {};
  const slot = {};
  const slotKey = 'content';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual(slot);
});

test('layout fields', () => {
  const layout = {
    contentAlign: 1,
    contentJustify: 2,
    contentDirection: 3,
    contentWrap: 4,
    contentOverflow: 5,
    contentGutter: 6,
  };
  const slot = {};
  const slotKey = 'content';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  });
});

test('slot fields', () => {
  const layout = {};
  const slot = {
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  };
  const slotKey = 'content';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  });
});

test('slot and layout', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const slot = {
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  };
  const slotKey = 'content';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  });
});

test('some slot and layout', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const slot = {
    align: 1,
    justify: 2,
    direction: 3,
  };
  const slotKey = 'content';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 44,
    overflow: 55,
    gutter: 66,
  });
});

test('some slot and layout with 0', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const slot = {
    align: 0,
    justify: 0,
    direction: 0,
    wrap: 0,
    overflow: 0,
    gutter: 0,
  };
  const slotKey = 'content';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual({
    align: 0,
    justify: 0,
    direction: 0,
    wrap: 0,
    overflow: 0,
    gutter: 0,
  });
});

test('slot and layout not content', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const slot = {
    align: 1,
  };
  const slotKey = 'none';
  expect(layoutParamsToSlot({ slotKey, slot, layout })).toEqual({
    align: 1,
  });
});
