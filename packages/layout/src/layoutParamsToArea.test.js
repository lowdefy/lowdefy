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

import { jest } from '@jest/globals';

import layoutParamsToArea from './layoutParamsToArea.js';

let warnSpy;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

test('empty area and layout', () => {
  const layout = {};
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual(area);
});

test('deprecated layout content* fields map to new area names', () => {
  const layout = {
    contentJustify: 2,
    contentDirection: 3,
    contentWrap: 4,
    contentOverflow: 5,
    contentGutter: 6,
  };
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gap: 6,
  });
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentGutter is deprecated. Use layout.gap instead.'
  );
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentJustify is deprecated. Use layout.justify instead.'
  );
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentDirection is deprecated. Use layout.direction instead.'
  );
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentWrap is deprecated. Use layout.wrap instead.'
  );
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentOverflow is deprecated. Use layout.overflow instead.'
  );
});

test('area fields', () => {
  const layout = {};
  const area = {
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gap: 6,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gap: 6,
  });
});

test('area and layout, area takes priority', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gap: 6,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gap: 6,
  });
});

test('some area and layout', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 1,
    justify: 2,
    direction: 3,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 44,
    overflow: 55,
    gap: 66,
  });
});

test('some area and layout with 0', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 0,
    justify: 0,
    direction: 0,
    wrap: 0,
    overflow: 0,
    gap: 0,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 0,
    justify: 0,
    direction: 0,
    wrap: 0,
    overflow: 0,
    gap: 0,
  });
});

test('area and layout not content', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 1,
  };
  const areaKey = 'none';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
  });
});

test('new layout property names', () => {
  const layout = {
    gap: 16,
    align: 'top',
    selfAlign: 'bottom',
    justify: 'center',
    direction: 'row',
    wrap: 'wrap',
    overflow: 'scroll',
  };
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    gap: 16,
    align: 'top',
    justify: 'center',
    direction: 'row',
    wrap: 'wrap',
    overflow: 'scroll',
  });
  expect(warnSpy).not.toHaveBeenCalled();
});

test('deprecated contentGutter emits warning', () => {
  const layout = { contentGutter: 16 };
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({ gap: 16 });
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentGutter is deprecated. Use layout.gap instead.'
  );
});

test('deprecated contentGap emits warning', () => {
  const layout = { contentGap: 16 };
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({ gap: 16 });
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.contentGap is deprecated. Use layout.gap instead.'
  );
});

test('area.gutter normalizes to area.gap with warning', () => {
  const layout = {};
  const area = { gutter: 20 };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({ gutter: 20, gap: 20 });
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] slots.content.gutter is deprecated. Use gap instead.'
  );
});

test('align without selfAlign is old self-alignment behavior', () => {
  const layout = { align: 'top' };
  const area = {};
  const areaKey = 'content';
  const result = layoutParamsToArea({ areaKey, area, layout });
  expect(result.align).toBeUndefined();
  expect(warnSpy).toHaveBeenCalledWith(
    '[Lowdefy] layout.align for self-alignment is deprecated. Use layout.selfAlign instead.'
  );
});

test('align with selfAlign is content alignment', () => {
  const layout = { align: 'top', selfAlign: 'bottom' };
  const area = {};
  const areaKey = 'content';
  const result = layoutParamsToArea({ areaKey, area, layout });
  expect(result.align).toBe('top');
  expect(warnSpy).not.toHaveBeenCalled();
});

test('new name takes priority over deprecated', () => {
  const layout = { gap: 10, contentGutter: 20 };
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({ gap: 10 });
  expect(warnSpy).not.toHaveBeenCalled();
});

test('area.gap takes priority over layout.gap', () => {
  const layout = { gap: 10 };
  const area = { gap: 5 };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({ gap: 5 });
});
