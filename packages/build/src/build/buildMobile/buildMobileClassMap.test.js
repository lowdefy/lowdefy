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

import buildMobileClassMap from './buildMobileClassMap.js';
import buildMobileTheme from './buildMobileTheme.js';
import collectMobileClassCandidates from './collectMobileClassCandidates.js';
import testContext from '../../test-utils/testContext.js';

function createPage({ target = 'mobile', blocks }) {
  return { pageId: 'home', blockId: 'home', target, slots: { content: { blocks } } };
}

async function runClassMap({ pages, theme = {} }) {
  const context = testContext();
  context.errors = [];
  const components = { mobile: {}, pages, theme };
  buildMobileTheme({ components, context });
  collectMobileClassCandidates({ components, context });
  await buildMobileClassMap({ components, context });
  return context;
}

test('buildMobileClassMap compiles classes from both branches of an _if, with dark: and sm: variants', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [
          {
            blockId: 'card',
            '~k': 'k1',
            class: {
              block: {
                _if: {
                  test: { _state: 'active' },
                  then: 'p-4 bg-white dark:bg-gray-900',
                  else: 'p-2 sm:flex-row',
                },
              },
            },
          },
        ],
      }),
    ],
  });
  expect(context.errors).toEqual([]);
  expect(context.mobileClassMap).toEqual({
    'bg-white': { backgroundColor: '#fff' },
    'dark:bg-gray-900': { backgroundColor: '#101828' },
    'p-2': { paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8 },
    'p-4': { paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16 },
    'sm:flex-row': { flexDirection: 'row' },
  });
});

test('buildMobileClassMap refuses hover: naming page, block and class', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [{ blockId: 'save', '~k': 'k1', class: { block: 'p-4 hover:bg-blue-500' } }],
      }),
    ],
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Class "hover:bg-blue-500" on block "save" on page "home" has no native form, so a mobile shell cannot apply it. Mobile pages support spacing, sizing, flex and gap, colours, font size and weight, borders, radius and opacity classes, with the dark:, sm:, md: and lg: prefixes.',
  ]);
  expect(context.errors[0].configKey).toBe('k1');
  expect(context.mobileClassMap['p-4']).toBeDefined();
});

test('buildMobileClassMap refuses grid, transition and cursor classes', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [
          {
            blockId: 'grid',
            class: { block: 'grid grid-cols-2 transition cursor-pointer xl:p-4' },
          },
        ],
      }),
    ],
  });
  expect(context.errors.map((error) => error.message.split(' on block')[0])).toEqual([
    'Class "grid"',
    'Class "grid-cols-2"',
    'Class "transition"',
    'Class "cursor-pointer"',
    'Class "xl:p-4"',
  ]);
});

test('buildMobileClassMap skips prose in properties and non-class strings in class operators', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [
          {
            blockId: 'title',
            properties: {
              title: 'Show the grid table on hover: quickly',
              content: 'Pick a flex plan',
            },
            class: { block: { _if: { test: { _state: 'isOpen' }, then: 'p-4', else: 'p-2' } } },
          },
        ],
      }),
    ],
  });
  expect(context.errors).toEqual([]);
  // "flex" is a class as well as a word; it compiles harmlessly.
  expect(Object.keys(context.mobileClassMap)).toEqual(['flex', 'p-2', 'p-4']);
});

test('buildMobileClassMap adds dark entries for classes that use antd theme colours', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [{ blockId: 'box', class: { block: 'bg-primary text-text-secondary' } }],
      }),
    ],
    theme: { antd: { token: { colorPrimary: '#6366f1' } } },
  });
  const { mobileClassMap, mobileTheme } = context;
  expect(mobileClassMap['bg-primary']).toEqual({ backgroundColor: '#6366f1' });
  expect(mobileClassMap['dark:bg-primary']).toEqual({
    backgroundColor: mobileTheme.dark.colorPrimary,
  });
  expect(mobileClassMap['text-text-secondary']).toEqual({
    color: mobileTheme.light.colorTextSecondary,
  });
  expect(mobileClassMap['dark:text-text-secondary']).toEqual({
    color: mobileTheme.dark.colorTextSecondary,
  });
});

test('buildMobileClassMap compiles with theme.tailwind and Tailwind 4 colours and radii', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [
          {
            blockId: 'box',
            class: { block: 'bg-brand p-gutter rounded-md bg-red-500/50 rounded-lg' },
          },
        ],
      }),
    ],
    theme: { tailwind: { color: { brand: '#ff6600' }, spacing: { gutter: '20px' } } },
  });
  expect(context.errors).toEqual([]);
  expect(context.mobileClassMap).toEqual({
    'bg-brand': { backgroundColor: '#ff6600' },
    'bg-red-500/50': { backgroundColor: 'rgba(251, 44, 54, 0.5)' },
    'p-gutter': { paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20 },
    // Tailwind 4's rounded-md; rounded-lg follows antd's borderRadiusLG through the bridge.
    'rounded-lg': { borderRadius: 8 },
    'rounded-md': { borderRadius: 6 },
  });
});

test('buildMobileClassMap reads classes inside _js source', async () => {
  const context = await runClassMap({
    pages: [
      createPage({
        blocks: [
          { blockId: 'box', class: { block: { _js: "return state.on ? 'gap-2' : 'gap-4';" } } },
        ],
      }),
    ],
  });
  expect(context.errors).toEqual([]);
  expect(context.mobileClassMap).toEqual({ 'gap-2': { gap: 8 }, 'gap-4': { gap: 16 } });
});

test('buildMobileClassMap leaves web pages out and writes an empty map without a mobile key', async () => {
  const webOnly = await runClassMap({
    pages: [
      createPage({ target: null, blocks: [{ blockId: 'a', class: { block: 'hover:p-4' } }] }),
    ],
  });
  expect(webOnly.errors).toEqual([]);
  expect(webOnly.mobileClassMap).toEqual({});

  const context = testContext();
  await buildMobileClassMap({ components: { pages: [] }, context });
  expect(context.mobileClassMap).toEqual({});
});
