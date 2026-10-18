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

import { getSlotIndex } from './frameSlots.js';
import getFrame from './getFrame.js';
import getPresentation from './getPresentation.js';
import getSlotRootPath from './getSlotRootPath.js';
import toRouterHref from './toRouterHref.js';
import { createRoot } from '../test/fixtures.js';

const tabsRoot = createRoot();

test('getFrame reads tabs, drawer and stack frames', () => {
  expect(getFrame(tabsRoot.menus).kind).toBe('tabs');
  expect(getFrame({ drawer: [{ pageId: 'today' }] })).toEqual({
    kind: 'drawer',
    items: [{ pageId: 'today' }],
  });
  expect(getFrame({ stack: true })).toEqual({ kind: 'stack', items: [] });
});

test('getFrame falls back to a stack when the caller may open fewer than two tabs', () => {
  expect(getFrame({ tabs: [{ pageId: 'today' }] }).kind).toBe('stack');
  expect(getFrame({ drawer: [] }).kind).toBe('stack');
});

test('getSlotIndex reads the frame group of a route segment', () => {
  expect(getSlotIndex('(t0)')).toBe(0);
  expect(getSlotIndex('(t3)')).toBe(3);
  expect(getSlotIndex('jobs')).toBe(-1);
});

test('getSlotRootPath gives each tab its page and a stack the home page', () => {
  expect(getSlotRootPath({ root: tabsRoot, slotIndex: 0 })).toBe('today');
  expect(getSlotRootPath({ root: tabsRoot, slotIndex: 1 })).toBe('jobs');
  expect(getSlotRootPath({ root: tabsRoot, slotIndex: 4 })).toBeNull();
  const stackRoot = createRoot({ menus: { stack: true }, homePageId: 'jobs' });
  expect(getSlotRootPath({ root: stackRoot, slotIndex: 0 })).toBe('jobs');
});

test('toRouterHref switches tabs for a link to a tab page and keeps the query', () => {
  expect(toRouterHref({ pathname: '/jobs', query: 'a=1', root: tabsRoot })).toBe('/(t1)?a=1');
  expect(toRouterHref({ pathname: '/jobs/12', query: '', root: tabsRoot })).toBe('/jobs/12');
  const stackRoot = createRoot({ menus: { stack: true } });
  expect(toRouterHref({ pathname: '/jobs', query: 'a=1', root: stackRoot })).toBe('/jobs?a=1');
});

test('getPresentation maps Screen presentations to native stack presentations', () => {
  expect(getPresentation('card')).toBe('card');
  expect(getPresentation('modal')).toBe('modal');
  expect(getPresentation('sheet')).toBe('formSheet');
  expect(getPresentation(undefined)).toBe('card');
});
