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

import React from 'react';
import { jest } from '@jest/globals';
import { Dimensions, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { appStorageKey, serializer } from '@lowdefy/helpers';

import buildPage from './test/buildPage.js';
import classMap from './test/classMap.json';
import createFakeHost from './test/createFakeHost.js';
import createTypes from './test/createTypes.js';
import LowdefyPage from './LowdefyPage.js';
import theme from './test/theme.json';

// Layout, classes, styles and theme as a page's blocks get them. theme.json and classMap.json
// are what the build writes for an app with colorPrimary #6366f1.

const PHONE = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const TABLET_SM = { width: 700, height: 1000 };
const TABLET_MD = { width: 768, height: 1024 };

let dimensionsSpy;

function setWindow({ width, height }) {
  dimensionsSpy?.mockRestore();
  dimensionsSpy = jest
    .spyOn(Dimensions, 'get')
    .mockImplementation(() => ({ width, height, scale: 2, fontScale: 1 }));
}

afterEach(() => {
  dimensionsSpy?.mockRestore();
  dimensionsSpy = undefined;
});

async function renderPage({ pageConfig, rootConfig = {}, storage = {}, window = PHONE }) {
  setWindow(window);
  const { host } = createFakeHost({ path: `/${pageConfig.id}` });
  Object.entries(storage).forEach(([key, value]) => host.storage.set(key, value));
  const lowdefy = { buildId: 'build-1' };
  await render(
    <LowdefyPage
      core={{
        apiBase: 'https://app.lowdefy.test',
        auth: { authConfig: {} },
        basePath: '',
        lowdefy,
      }}
      host={host}
      pageConfig={buildPage(pageConfig)}
      rootConfig={{
        classMap,
        home: { configured: true, pageId: 'home' },
        lowdefyApp: { slug: 'test-app' },
        menus: [],
        pagePaths: { home: 'home' },
        theme,
        ...rootConfig,
      }}
      types={createTypes()}
    />
  );
  return { host, lowdefy };
}

function styleOf(element) {
  return StyleSheet.flatten(element.props.style);
}

async function press(text) {
  await act(async () => {
    fireEvent.press(screen.getByText(text));
  });
}

const darkModeButton = {
  id: 'go_dark',
  type: 'Button',
  properties: { title: 'Go dark' },
  events: { onClick: [{ id: 'dark', type: 'SetDarkMode', params: { darkMode: 'dark' } }] },
};

const twoHalves = {
  id: 'home',
  type: 'Box',
  blocks: [
    { id: 'left', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'Left' } },
    { id: 'right', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'Right' } },
  ],
};

test('span 12 and 12 sit side by side at md and stack at sm', async () => {
  await renderPage({ pageConfig: twoHalves, window: TABLET_MD });
  await screen.findByText('Left');
  expect(styleOf(screen.getByTestId('left')).width).toBe('50%');
  expect(styleOf(screen.getByTestId('right')).width).toBe('50%');

  await renderPage({ pageConfig: twoHalves, window: TABLET_SM });
  await screen.findByText('Left');
  expect(styleOf(screen.getByTestId('left')).width).toBe('100%');
  expect(styleOf(screen.getByTestId('right')).width).toBe('100%');
});

test('a phone in landscape keeps its portrait breakpoint and stacks spans', async () => {
  await renderPage({ pageConfig: twoHalves, window: PHONE_LANDSCAPE });
  await screen.findByText('Left');
  expect(styleOf(screen.getByTestId('left')).width).toBe('100%');
  expect(styleOf(screen.getByTestId('right')).width).toBe('100%');
});

test('a gapped area widens by its column gap, and its blocks take the gap and offsets', async () => {
  await renderPage({
    window: TABLET_MD,
    pageConfig: {
      id: 'home',
      type: 'Box',
      layout: { gap: [16, 12] },
      blocks: [
        { id: 'a', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'A' } },
        {
          id: 'b',
          type: 'Paragraph',
          layout: { span: 6, offset: 6 },
          style: { block: { backgroundColor: 'red' } },
          properties: { content: 'B' },
        },
      ],
    },
  });
  await screen.findByText('A');
  const placementA = screen.getByTestId('a').parent;
  const placementB = screen.getByTestId('b').parent;
  expect(styleOf(placementA)).toEqual({ paddingLeft: 16, width: '50%' });
  expect(styleOf(placementB)).toEqual({ marginLeft: '25%', paddingLeft: 16, width: '25%' });
  // The block's own style is inside the gap padding, as the web's column div carries it.
  expect(styleOf(screen.getByTestId('b'))).toEqual({ backgroundColor: 'red', flexGrow: 1 });
  expect(styleOf(placementA.parent)).toEqual({
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -16,
    rowGap: 12,
  });
});

test('blocks aligned in a gapped wrapping row size to their content, not the row', async () => {
  // A centred wrapping row of tags and a footnote (a design hero's chips). An inner view that grew
  // took the row's height in React Native, so every line drew as tall as the row, and the lines
  // after the first fell below it, over the next block.
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      layout: { direction: 'column', gap: 10 },
      blocks: [
        {
          id: 'chips',
          type: 'Box',
          layout: { direction: 'row', wrap: 'wrap', gap: 8, align: 'middle' },
          blocks: [
            { id: 'space', type: 'Paragraph', properties: { content: 'Acme' } },
            { id: 'key', type: 'Paragraph', properties: { content: 'ACME-645' } },
          ],
        },
        { id: 'title', type: 'Paragraph', properties: { content: 'Title' } },
      ],
    },
  });
  await screen.findByText('ACME-645');
  expect(styleOf(screen.getByTestId('space')).flexGrow).toBeUndefined();
  expect(styleOf(screen.getByTestId('key')).flexGrow).toBeUndefined();
  expect(styleOf(screen.getByTestId('key').parent)).toEqual({ paddingLeft: 8, width: '100%' });
  // In a column, a block that does not grow sizes to its content too.
  expect(styleOf(screen.getByTestId('chips')).flexGrow).toBeUndefined();
});

test('a block a gapped row stretches, or a gapped column grows, fills its placement', async () => {
  await renderPage({
    window: TABLET_MD,
    pageConfig: {
      id: 'home',
      type: 'Box',
      layout: { direction: 'column', gap: 10 },
      blocks: [
        {
          id: 'cards',
          type: 'Box',
          layout: { grow: 1, gap: 8 },
          blocks: [
            { id: 'short', type: 'Paragraph', layout: { span: 12 }, properties: { content: 'S' } },
            {
              id: 'aligned',
              type: 'Paragraph',
              layout: { span: 12, selfAlign: 'top' },
              properties: { content: 'A' },
            },
          ],
        },
      ],
    },
  });
  await screen.findByText('S');
  expect(styleOf(screen.getByTestId('cards')).flexGrow).toBe(1);
  expect(styleOf(screen.getByTestId('short')).flexGrow).toBe(1);
  expect(styleOf(screen.getByTestId('aligned')).flexGrow).toBeUndefined();
});

test('an area draws its blocks in layout order at the breakpoint', async () => {
  await renderPage({
    window: TABLET_MD,
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        { id: 'first', type: 'Paragraph', layout: { order: 2 }, properties: { content: '1' } },
        { id: 'second', type: 'Paragraph', layout: { order: 1 }, properties: { content: '2' } },
      ],
    },
  });
  await screen.findByText('1');
  const area = screen.getByTestId('first').parent;
  expect(area.children.map((child) => child.props.testID)).toEqual(['second', 'first']);
});

test('a class an _if chooses at runtime takes its style from the class map', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      events: { onInit: [{ id: 'init', type: 'SetState', params: { compact: false } }] },
      blocks: [
        {
          id: 'card',
          type: 'Paragraph',
          class: { block: { _if: { test: { _state: 'compact' }, then: 'p-2', else: 'p-4' } } },
          properties: { content: 'Card' },
        },
        {
          id: 'compact',
          type: 'Button',
          properties: { title: 'Compact' },
          events: { onClick: [{ id: 'set', type: 'SetState', params: { compact: true } }] },
        },
      ],
    },
  });
  await screen.findByText('Card');
  expect(styleOf(screen.getByTestId('card'))).toMatchObject({ paddingTop: 16, paddingLeft: 16 });
  await press('Compact');
  expect(styleOf(screen.getByTestId('card'))).toMatchObject({ paddingTop: 8, paddingLeft: 8 });
});

test('breakpoint classes apply from their breakpoint up', async () => {
  const pageConfig = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'card',
        type: 'Paragraph',
        class: { block: 'md:p-8 p-2 sm:p-6' },
        properties: { content: 'C' },
      },
    ],
  };
  const paddingAt = async (window) => {
    await renderPage({ pageConfig, window });
    await screen.findByText('C');
    return styleOf(screen.getByTestId('card')).paddingTop;
  };
  expect(await paddingAt(PHONE)).toBe(8);
  expect(await paddingAt(TABLET_SM)).toBe(24);
  expect(await paddingAt(TABLET_MD)).toBe(32);
});

test('dark: classes and antd colour classes switch with the theme mode', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        { id: 'panel', type: 'Paragraph', class: { block: 'bg-white dark:bg-gray-900' } },
        { id: 'brand', type: 'Paragraph', class: { block: 'bg-primary' } },
        {
          id: 'mode',
          type: 'Paragraph',
          properties: { content: { '_string.concat': ['dark ', { _media: 'darkMode' }] } },
        },
        darkModeButton,
      ],
    },
  });
  expect(await screen.findByText('dark false')).toBeTruthy();
  expect(styleOf(screen.getByTestId('panel')).backgroundColor).toBe('#fff');
  expect(styleOf(screen.getByTestId('brand')).backgroundColor).toBe('#6366f1');
  await press('Go dark');
  expect(await screen.findByText('dark true')).toBeTruthy();
  expect(styleOf(screen.getByTestId('panel')).backgroundColor).toBe('#101828');
  expect(styleOf(screen.getByTestId('brand')).backgroundColor).toBe('#575ad0');
});

test('a class missing from the class map is ignored with one dev warning', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        {
          id: 'a',
          type: 'Paragraph',
          class: { block: 'p-4 made-up' },
          properties: { content: 'A' },
        },
        { id: 'b', type: 'Paragraph', class: { block: 'made-up' }, properties: { content: 'B' } },
      ],
    },
  });
  await screen.findByText('B');
  expect(styleOf(screen.getByTestId('a'))).toMatchObject({ paddingTop: 16 });
  const warnings = warn.mock.calls.filter(([message]) => String(message).includes('"made-up"'));
  expect(warnings).toEqual([
    [
      'Class "made-up" is not in the app\'s class map, so it has no style on mobile. Classes put together at runtime must appear as literals in config for the build to compile them.',
    ],
  ]);
  warn.mockRestore();
});

test('a page built on request brings the class map entries of its own classes', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      _classMap: { 'text-xl': { fontSize: 20 } },
      blocks: [{ id: 'a', type: 'Paragraph', class: { block: 'text-xl p-2' } }],
    },
  });
  await screen.findByTestId('a');
  expect(styleOf(screen.getByTestId('a'))).toMatchObject({ fontSize: 20, paddingTop: 8 });
});

test('a slot style goes over its classes, which go over the theme and block defaults', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        {
          id: 'card',
          type: 'Themed',
          class: { element: 'p-4 bg-primary' },
          style: { element: { paddingTop: 2 } },
        },
      ],
    },
  });
  const element = await screen.findByTestId('card-element');
  expect(styleOf(element)).toEqual({
    // block default
    padding: 4,
    // theme, under the class's background
    color: theme.light.colorText,
    backgroundColor: '#6366f1',
    // class, under the style's paddingTop
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingTop: 2,
  });
});

test('operator styles and shared page styles are converted to React Native values', async () => {
  const { host } = await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      target: 'both',
      blocks: [
        { id: 'shared', type: 'Paragraph', style: { block: { margin: '4px 8px' } } },
        {
          id: 'computed',
          type: 'Paragraph',
          style: { block: { display: { _if: { test: true, then: 'grid', else: 'flex' } } } },
        },
      ],
    },
  });
  await screen.findByTestId('shared');
  expect(styleOf(screen.getByTestId('shared'))).toMatchObject({
    marginTop: 4,
    marginRight: 8,
    marginBottom: 4,
    marginLeft: 8,
  });
  expect(styleOf(screen.getByTestId('computed')).display).toBeUndefined();
  const reported = host.fetch.mock.calls
    .filter(([url]) => url.endsWith('/api/client-error'))
    .map(([, init]) => serializer.deserialize(JSON.parse(init.body)).message);
  expect(reported).toEqual([
    expect.stringContaining(
      'Style "display" in slot "block" on block "computed" is not supported on mobile.'
    ),
  ]);
});

test('an operator style on a mobile-only page is converted, a literal one is used as built', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      target: 'mobile',
      blocks: [
        {
          id: 'computed',
          type: 'Paragraph',
          style: { block: { padding: { _if: { test: true, then: '8px 24px', else: 0 } } } },
        },
        { id: 'built', type: 'Paragraph', style: { block: { paddingTop: 3 } } },
      ],
    },
  });
  await screen.findByTestId('computed');
  expect(styleOf(screen.getByTestId('computed'))).toMatchObject({
    paddingTop: 8,
    paddingRight: 24,
    paddingBottom: 8,
    paddingLeft: 24,
  });
  expect(styleOf(screen.getByTestId('built'))).toEqual({ paddingTop: 3, width: '100%' });
});

test('blocks read the theme tokens of theme.json for the mode showing', async () => {
  await renderPage({
    pageConfig: {
      id: 'home',
      type: 'Box',
      blocks: [
        { id: 'tokens', type: 'Themed' },
        {
          id: 'primary',
          type: 'Paragraph',
          properties: { content: { '_string.concat': ['primary ', { _theme: 'colorPrimary' }] } },
        },
        darkModeButton,
      ],
    },
  });
  const tokens = await screen.findByTestId('tokens-element');
  expect(JSON.parse(tokens.props.children)).toMatchObject({
    ...theme.light,
    colorCell: '#FFFFFF',
    colorGroupedBackground: '#F2F2F7',
    colorLabel: '#000000',
    colorTint: theme.light.colorPrimary,
  });
  expect(screen.getByText(`primary ${theme.light.colorPrimary}`)).toBeTruthy();
  await press('Go dark');
  expect(JSON.parse(screen.getByTestId('tokens-element').props.children)).toMatchObject({
    ...theme.dark,
    colorCell: '#1C1C1E',
    colorGroupedBackground: '#000000',
    colorLabel: '#FFFFFF',
    colorTint: theme.dark.colorPrimary,
  });
  expect(await screen.findByText(`primary ${theme.dark.colorPrimary}`)).toBeTruthy();
});

test('the theme mode follows theme.darkMode, then the stored preference', async () => {
  const pageConfig = { id: 'home', type: 'Box', blocks: [{ id: 'tokens', type: 'Themed' }] };
  const tokensShown = async () =>
    JSON.parse((await screen.findByTestId('tokens-element')).props.children);

  await renderPage({ pageConfig, rootConfig: { theme: { ...theme, darkMode: 'dark' } } });
  expect(await tokensShown()).toMatchObject(theme.dark);

  const storageKey = appStorageKey({ basePath: '', name: 'lowdefy_darkMode', slug: 'test-app' });
  await renderPage({ pageConfig, storage: { [storageKey]: 'dark' } });
  expect(await tokensShown()).toMatchObject(theme.dark);

  await renderPage({
    pageConfig,
    rootConfig: { theme: { ...theme, darkMode: 'light' } },
    storage: { [storageKey]: 'dark' },
  });
  expect(await tokensShown()).toMatchObject(theme.light);
});

test('the page is drawn on the grouped background of the mode showing', async () => {
  await renderPage({
    pageConfig: { id: 'home', type: 'Box', blocks: [darkModeButton] },
  });
  await screen.findByText('Go dark');
  const scrollView = () => screen.root;
  expect(styleOf(scrollView()).backgroundColor).toBe('#F2F2F7');
  await press('Go dark');
  expect(styleOf(scrollView()).backgroundColor).toBe('#000000');
});

test('SetDarkMode stores the preference under the app key', async () => {
  const { host } = await renderPage({
    pageConfig: { id: 'home', type: 'Box', blocks: [darkModeButton] },
  });
  await screen.findByText('Go dark');
  await press('Go dark');
  const storageKey = appStorageKey({ basePath: '', name: 'lowdefy_darkMode', slug: 'test-app' });
  expect(host.storage.get(storageKey)).toBe('dark');
  expect(host.globals.window.__lowdefy_isDark).toBe(true);
  expect(host.globals.window.__lowdefy_darkModePreference).toBe('dark');
});
