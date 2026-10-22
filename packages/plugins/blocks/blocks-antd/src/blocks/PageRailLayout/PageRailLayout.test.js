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

import {
  COLLAPSE_DISTANCE,
  clampPanelWidth,
  getDragWidth,
  getPanelLimits,
} from './clampPanelWidth.js';
import getBadge from './getBadge.js';
import getLayoutMode from './getLayoutMode.js';
import { getPlaceBadge, getPlaceKey } from './placeKeys.js';

const limits = getPanelLimits({});

describe('getPanelLimits', () => {
  test('defaults to 240 to 480 pixels, opening at 300', () => {
    expect(limits).toEqual({ minWidth: 240, maxWidth: 480, initialWidth: 300 });
  });

  test('takes the panel properties', () => {
    expect(getPanelLimits({ minWidth: 200, maxWidth: 400, initialWidth: 260 })).toEqual({
      minWidth: 200,
      maxWidth: 400,
      initialWidth: 260,
    });
  });

  test('never lets the largest width fall below the smallest', () => {
    expect(getPanelLimits({ minWidth: 300, maxWidth: 200 }).maxWidth).toBe(300);
  });
});

describe('clampPanelWidth', () => {
  test('keeps a width in range', () => {
    expect(clampPanelWidth({ width: 320, ...limits })).toBe(320);
  });

  test('holds a width to the range', () => {
    expect(clampPanelWidth({ width: 100, ...limits })).toBe(240);
    expect(clampPanelWidth({ width: 900, ...limits })).toBe(480);
  });

  test('rounds to whole pixels', () => {
    expect(clampPanelWidth({ width: 300.6, ...limits })).toBe(301);
  });

  test('gives the initial width for anything that is not a number', () => {
    expect(clampPanelWidth({ width: undefined, ...limits })).toBe(300);
    expect(clampPanelWidth({ width: NaN, ...limits })).toBe(300);
    expect(clampPanelWidth({ width: '320', ...limits })).toBe(300);
  });
});

describe('getDragWidth', () => {
  test('follows the pointer within the range', () => {
    expect(getDragWidth({ raw: 350, ...limits })).toEqual({ width: 350, collapse: false });
  });

  test('stops at the largest width', () => {
    expect(getDragWidth({ raw: 900, ...limits })).toEqual({ width: 480, collapse: false });
  });

  test('resists below the smallest width, moving a quarter of the distance', () => {
    expect(getDragWidth({ raw: 200, ...limits })).toEqual({ width: 230, collapse: false });
  });

  test('collapses once the drag is far enough past the smallest width', () => {
    expect(getDragWidth({ raw: 240 - COLLAPSE_DISTANCE, ...limits }).collapse).toBe(false);
    expect(getDragWidth({ raw: 240 - COLLAPSE_DISTANCE - 1, ...limits })).toEqual({
      width: 0,
      collapse: true,
    });
  });
});

describe('getLayoutMode', () => {
  const breakpoints = { drawerBreakpoint: 1100, mobileBreakpoint: 768 };
  const at = (width) => (query) => ({
    matches: width <= Number(query.match(/max-width: ([\d.]+)px/)[1]),
  });

  test('is desktop at and above the drawer breakpoint', () => {
    expect(getLayoutMode({ ...breakpoints, matchMedia: at(1100) })).toBe('desktop');
    expect(getLayoutMode({ ...breakpoints, matchMedia: at(1600) })).toBe('desktop');
  });

  test('is tablet between the breakpoints', () => {
    expect(getLayoutMode({ ...breakpoints, matchMedia: at(1099) })).toBe('tablet');
    expect(getLayoutMode({ ...breakpoints, matchMedia: at(768) })).toBe('tablet');
  });

  test('is phone below the mobile breakpoint', () => {
    expect(getLayoutMode({ ...breakpoints, matchMedia: at(767) })).toBe('phone');
    expect(getLayoutMode({ ...breakpoints, matchMedia: at(390) })).toBe('phone');
  });

  test('is desktop where there is no matchMedia', () => {
    expect(getLayoutMode({ ...breakpoints, matchMedia: undefined })).toBe('desktop');
  });
});

describe('getBadge', () => {
  test('reads a number as a default badge', () => {
    expect(getBadge(5)).toEqual({ dot: false, text: '5', tone: 'default', label: undefined });
  });

  test('reads count, tone and label from an object', () => {
    expect(getBadge({ count: 2, tone: 'error', label: '2 late' })).toEqual({
      dot: false,
      text: '2',
      tone: 'error',
      label: '2 late',
    });
  });

  test('shows nothing for 0 or no value', () => {
    expect(getBadge(0)).toBe(null);
    expect(getBadge(undefined)).toBe(null);
    expect(getBadge(null)).toBe(null);
  });

  test('shows a dot with no number', () => {
    expect(getBadge({ dot: true })).toEqual({
      dot: true,
      text: '0',
      tone: 'default',
      label: undefined,
    });
  });

  test('caps the number at the overflow count', () => {
    expect(getBadge(120).text).toBe('99+');
    expect(getBadge({ count: 12, overflowCount: 9 }).text).toBe('9+');
  });
});

describe('getPlaceKey', () => {
  test("strips the build's menu item prefix", () => {
    expect(getPlaceKey({ id: 'menuitem:default:controls' })).toBe('controls');
  });

  test('keeps an id the build did not rename', () => {
    expect(getPlaceKey({ id: 'controls' })).toBe('controls');
  });

  test('falls back to the page id', () => {
    expect(getPlaceKey({ pageId: 'controls' })).toBe('controls');
  });
});

describe('getPlaceBadge', () => {
  test('finds a badge by the id the app wrote', () => {
    expect(
      getPlaceBadge({ controls: 3 }, { id: 'menuitem:default:controls', pageId: 'framework' })
    ).toBe(3);
  });

  test('finds a badge by page id', () => {
    expect(
      getPlaceBadge({ framework: 4 }, { id: 'menuitem:default:controls', pageId: 'framework' })
    ).toBe(4);
  });

  test('is undefined when neither matches', () => {
    expect(getPlaceBadge({}, { id: 'menuitem:default:controls' })).toBe(undefined);
  });
});
