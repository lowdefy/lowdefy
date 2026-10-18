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

import { getSlotIndex } from './frameSlots.js';
import getFrame from './getFrame.js';
import getPresentation from './getPresentation.js';
import getSlotRootPath from './getSlotRootPath.js';
import getStackOptions from './getStackOptions.js';
import getTabHref from './getTabHref.js';
import getTabIcons from './getTabIcons.js';
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

test('getTabHref names the tab that shows a page, and no tab for other pages and frames', () => {
  expect(getTabHref({ path: 'today', query: '', root: tabsRoot })).toBe('/(t0)');
  expect(getTabHref({ path: 'jobs', query: 'a=1', root: tabsRoot })).toBe('/(t1)?a=1');
  expect(getTabHref({ path: 'jobs/12', query: '', root: tabsRoot })).toBeNull();
  const stackRoot = createRoot({ menus: { stack: true } });
  expect(getTabHref({ path: 'jobs', query: '', root: stackRoot })).toBeNull();
});

test('getPresentation maps Screen presentations to native stack presentations', () => {
  expect(getPresentation('card')).toBe('card');
  expect(getPresentation('modal')).toBe('modal');
  expect(getPresentation('sheet')).toBe('formSheet');
  expect(getPresentation(undefined)).toBe('card');
});

function headerAction(overrides) {
  return {
    disabled: false,
    id: 'add',
    onPress: jest.fn(),
    placement: 'right',
    render: () => 'icon button',
    sfSymbol: 'plus',
    title: 'Add',
    ...overrides,
  };
}

const screenOptions = {
  headerActions: [],
  headerLeft: undefined,
  headerRight: undefined,
  headerSearch: undefined,
  largeTitle: false,
  presentation: 'card',
  title: 'Designs',
};

test('getStackOptions gives a large title, the presentation and a native search bar', () => {
  const headerSearch = {
    autoFocus: true,
    hideWhenScrolling: false,
    onCancel: jest.fn(),
    onChangeText: jest.fn(),
    onSearch: jest.fn(),
    placeholder: 'Search designs',
  };
  const searchBarRef = { current: null };
  const options = getStackOptions({
    options: { ...screenOptions, headerSearch, largeTitle: true, presentation: 'sheet' },
    platform: 'ios',
    searchBarRef,
  });
  expect(options).toMatchObject({
    headerLargeTitleEnabled: true,
    presentation: 'formSheet',
    title: 'Designs',
  });
  // No header items: the sides are left as the stack has them (a drawer's menu button).
  expect(options).not.toHaveProperty('headerLeft');
  expect(options).not.toHaveProperty('headerRight');
  const search = options.headerSearchBarOptions;
  expect(search).toMatchObject({ placeholder: 'Search designs', ref: searchBarRef });
  search.onChangeText({ nativeEvent: { text: 'dar' } });
  search.onSearchButtonPress({ nativeEvent: { text: 'dark' } });
  search.onCancelButtonPress({});
  expect(headerSearch.onChangeText).toHaveBeenCalledWith('dar');
  expect(headerSearch.onSearch).toHaveBeenCalledWith('dark');
  expect(headerSearch.onCancel).toHaveBeenCalled();
});

test('getStackOptions draws header actions as native SF Symbol bar buttons on iOS', () => {
  const slot = () => 'slot blocks';
  const add = headerAction();
  const squirrel = headerAction({ id: 'squirrel', placement: 'left', sfSymbol: null });
  const options = getStackOptions({
    options: { ...screenOptions, headerActions: [add, squirrel], headerRight: slot },
    platform: 'ios',
    searchBarRef: { current: null },
  });
  expect(options.headerRight).toBeUndefined();
  expect(options.unstable_headerRightItems()).toEqual([
    { type: 'custom', element: 'slot blocks' },
    {
      type: 'button',
      accessibilityLabel: 'Add',
      disabled: false,
      icon: { type: 'sfSymbol', name: 'plus' },
      identifier: 'add',
      label: 'Add',
      onPress: add.onPress,
    },
  ]);
  // An icon with no SF Symbol draws as its own icon button.
  expect(options.unstable_headerLeftItems()).toEqual([{ type: 'custom', element: 'icon button' }]);
});

test('getStackOptions draws a header slot alone as its custom view on iOS', () => {
  const slot = () => 'slot blocks';
  const options = getStackOptions({
    options: { ...screenOptions, headerRight: slot },
    platform: 'ios',
    searchBarRef: { current: null },
  });
  expect(options.headerRight).toBe(slot);
  expect(options.unstable_headerRightItems).toBeUndefined();
});

test('getStackOptions draws header actions as a row of icon buttons off iOS', () => {
  const options = getStackOptions({
    options: { ...screenOptions, headerActions: [headerAction()] },
    platform: 'android',
    searchBarRef: { current: null },
  });
  expect(options).not.toHaveProperty('unstable_headerRightItems');
  const row = options.headerRight();
  expect(row.props.children).toEqual([null, ['icon button']]);
});

test('getTabIcons gives SF Symbols on iOS and Lucide icon data elsewhere', () => {
  const inbox = { node: [['path', { d: 'M1 1' }]] };
  const squirrel = { node: [['path', { d: 'M2 2' }]] };
  const items = [
    { pageId: 'my-work', icon: 'Inbox', iconData: inbox },
    { pageId: 'designs', icon: 'FileText', iconData: {}, sfSymbol: 'doc.richtext' },
    { pageId: 'pets', icon: 'Squirrel', iconData: squirrel },
    { pageId: 'plain' },
  ];
  expect(getTabIcons({ items, platform: 'ios' })).toEqual([
    { pageId: 'my-work', sf: 'tray', iconData: null },
    { pageId: 'designs', sf: 'doc.richtext', iconData: null },
    { pageId: 'pets', sf: null, iconData: squirrel },
    { pageId: 'plain', sf: null, iconData: null },
  ]);
  expect(getTabIcons({ items, platform: 'android' })[0]).toEqual({
    pageId: 'my-work',
    sf: null,
    iconData: inbox,
  });
});
