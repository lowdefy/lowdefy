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

import { clampPanelWidth, getPanelLimits } from './clampPanelWidth.js';
import getLayoutMode from './getLayoutMode.js';
import getRailBadge from './getRailBadge.js';

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

describe('getLayoutMode', () => {
  const breakpoints = { drawerBreakpoint: 1100, mobileBreakpoint: 768 };

  test('is desktop at and above the drawer breakpoint', () => {
    expect(getLayoutMode({ width: 1100, ...breakpoints })).toBe('desktop');
    expect(getLayoutMode({ width: 1600, ...breakpoints })).toBe('desktop');
  });

  test('is tablet between the breakpoints', () => {
    expect(getLayoutMode({ width: 1099, ...breakpoints })).toBe('tablet');
    expect(getLayoutMode({ width: 768, ...breakpoints })).toBe('tablet');
  });

  test('is phone below the mobile breakpoint', () => {
    expect(getLayoutMode({ width: 767, ...breakpoints })).toBe('phone');
    expect(getLayoutMode({ width: 390, ...breakpoints })).toBe('phone');
  });
});

describe('getRailBadge', () => {
  test('reads a number as a default badge', () => {
    expect(getRailBadge(5)).toEqual({ count: 5, tone: 'default' });
  });

  test('reads count and tone from an object', () => {
    expect(getRailBadge({ count: 2, tone: 'error' })).toEqual({ count: 2, tone: 'error' });
    expect(getRailBadge({ count: 2 })).toEqual({ count: 2, tone: 'default' });
  });

  test('reads anything else as no badge', () => {
    expect(getRailBadge(undefined)).toEqual({ count: 0, tone: 'default' });
    expect(getRailBadge(null)).toEqual({ count: 0, tone: 'default' });
  });
});
