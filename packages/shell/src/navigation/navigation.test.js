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
import isPageUnderHeader from './isPageUnderHeader.js';
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
    menu: null,
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

test('getStackOptions draws a header action with items as a native menu on iOS', () => {
  const copy = { destructive: false, disabled: false, id: 'copy_link', onPress: jest.fn() };
  const remove = { destructive: true, disabled: false, id: 'delete', onPress: jest.fn() };
  const more = headerAction({
    id: 'more',
    menu: [
      { ...copy, symbol: 'link', title: 'Copy link' },
      { ...remove, symbol: null, title: 'Delete' },
    ],
    sfSymbol: 'ellipsis',
    title: 'More',
  });
  const options = getStackOptions({
    options: { ...screenOptions, headerActions: [more] },
    platform: 'ios',
    searchBarRef: { current: null },
  });
  expect(options.unstable_headerRightItems()).toEqual([
    {
      type: 'menu',
      accessibilityLabel: 'More',
      disabled: false,
      icon: { type: 'sfSymbol', name: 'ellipsis' },
      identifier: 'more',
      label: 'More',
      menu: {
        items: [
          {
            type: 'action',
            destructive: false,
            disabled: false,
            icon: { type: 'sfSymbol', name: 'link' },
            label: 'Copy link',
            onPress: copy.onPress,
          },
          {
            type: 'action',
            destructive: true,
            disabled: false,
            icon: undefined,
            label: 'Delete',
            onPress: remove.onPress,
          },
        ],
      },
    },
  ]);
  // An action with a menu stays a native menu when its icon has no SF Symbol.
  const plain = getStackOptions({
    options: { ...screenOptions, headerActions: [{ ...more, sfSymbol: null }] },
    platform: 'ios',
    searchBarRef: { current: null },
  });
  expect(plain.unstable_headerRightItems()[0]).toMatchObject({ type: 'menu', icon: undefined });
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

test('getStackOptions hides the bar hairline for a headerBottom, which draws its own', () => {
  const options = getStackOptions({
    options: { ...screenOptions, headerBottom: true },
    platform: 'ios',
    searchBarRef: { current: null },
  });
  expect(options.headerShadowVisible).toBe(false);
  // Without one, the stack keeps its own default.
  expect(
    getStackOptions({ options: screenOptions, platform: 'ios', searchBarRef: { current: null } })
      .headerShadowVisible
  ).toBeUndefined();
});

test('getStackOptions makes the iOS bar clear over a Screen with a backgroundTint', () => {
  const tinted = { ...screenOptions, backgroundTint: true, largeTitle: true };
  const searchBarRef = { current: null };
  expect(
    getStackOptions({ options: tinted, platform: 'ios', platformVersion: '26.0', searchBarRef })
  ).toMatchObject({ headerBlurEffect: undefined, headerTransparent: true });
  // Before iOS 26: clear at the scroll edge, the chrome material once content scrolls under it.
  expect(
    getStackOptions({ options: tinted, platform: 'ios', platformVersion: '18.4', searchBarRef })
  ).toMatchObject({
    headerBlurEffect: 'systemChromeMaterial',
    headerLargeStyle: { backgroundColor: 'transparent' },
    headerTransparent: true,
  });
  // Untinted, and off iOS, the stack's own bar: set undefined, as setOptions merges.
  const untinted = getStackOptions({
    options: screenOptions,
    platform: 'ios',
    platformVersion: '26.0',
    searchBarRef,
  });
  expect(untinted).toHaveProperty('headerTransparent', undefined);
  expect(
    getStackOptions({ options: tinted, platform: 'android', platformVersion: 35, searchBarRef })
      .headerTransparent
  ).toBeUndefined();
});

test('isPageUnderHeader: a Screen with a backgroundTint scrolls under its clear bar on iOS', () => {
  expect(
    isPageUnderHeader({
      options: { backgroundTint: true },
      platform: 'ios',
      platformVersion: '18.4',
    })
  ).toBe(true);
  expect(
    isPageUnderHeader({
      options: { backgroundTint: true },
      platform: 'android',
      platformVersion: 35,
    })
  ).toBe(false);
});

test('isPageUnderHeader: iOS 26 pages scroll under the glass bar', () => {
  expect(isPageUnderHeader({ options: {}, platform: 'ios', platformVersion: '26.0' })).toBe(true);
  expect(isPageUnderHeader({ options: {}, platform: 'ios', platformVersion: '27.1' })).toBe(true);
});

test('isPageUnderHeader: before iOS 26 only a large title or search bar makes the bar translucent', () => {
  const ios18 = { platform: 'ios', platformVersion: '18.4' };
  expect(isPageUnderHeader({ ...ios18, options: { largeTitle: false } })).toBe(false);
  expect(isPageUnderHeader({ ...ios18, options: { largeTitle: true } })).toBe(true);
  expect(isPageUnderHeader({ ...ios18, options: { headerSearch: { placeholder: 'Find' } } })).toBe(
    true
  );
});

test('isPageUnderHeader: Android pages sit below the header', () => {
  expect(
    isPageUnderHeader({ options: { largeTitle: true }, platform: 'android', platformVersion: 35 })
  ).toBe(false);
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
