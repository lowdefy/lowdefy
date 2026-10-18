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

import validateMobileStyles from './validateMobileStyles.js';
import testContext from '../../test-utils/testContext.js';

function createContext() {
  const context = testContext();
  context.errors = [];
  return context;
}

function createPage({ target, style }) {
  return {
    pageId: 'home',
    blockId: 'home',
    target,
    slots: {
      content: {
        blocks: [{ blockId: 'card', type: 'Card', style, '~k': 'k1' }],
      },
    },
  };
}

test('validateMobileStyles converts px, rem and shorthands on a mobile page', () => {
  const context = createContext();
  const page = createPage({
    target: 'mobile',
    style: {
      block: { padding: '8px 24px', fontSize: '1.5rem', border: '1px solid #eee', '~k': 's1' },
      element: { borderRadius: '4px 8px', gap: '0.5rem', flex: '1 0 auto' },
    },
  });
  validateMobileStyles({ components: { pages: [page] }, context });
  expect(context.errors).toEqual([]);
  expect(page.slots.content.blocks[0].style).toEqual({
    block: {
      paddingTop: 8,
      paddingRight: 24,
      paddingBottom: 8,
      paddingLeft: 24,
      fontSize: 24,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#eee',
      '~k': 's1',
    },
    element: {
      borderTopLeftRadius: 4,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 4,
      borderBottomLeftRadius: 8,
      gap: 8,
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: 'auto',
    },
  });
});

test('validateMobileStyles refuses a grid style, naming page, block, slot and key', () => {
  const context = createContext();
  const page = createPage({
    target: 'mobile',
    style: { block: { display: 'grid', gridTemplateColumns: '1fr 1fr', '~k': 's1' } },
  });
  validateMobileStyles({ components: { pages: [page] }, context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Style "display" in slot "block" on block "card" on page "home" is not supported on mobile. "display: grid" is web-only: React Native views lay out with flex. Use "flex" or "none".',
    'Style "gridTemplateColumns" in slot "block" on block "card" on page "home" is not supported on mobile. "gridTemplateColumns" is web-only: React Native has no CSS grid. Use layout or flex instead.',
  ]);
  expect(context.errors[0].configKey).toBe('s1');
});

test('validateMobileStyles leaves slots with operators for the shell to convert', () => {
  const context = createContext();
  const operatorSlot = { _if: { test: true, then: { padding: '4px' }, else: {} } };
  const page = createPage({
    target: 'mobile',
    style: {
      block: operatorSlot,
      element: { padding: '8px 4px', color: { _state: 'color' } },
    },
  });
  validateMobileStyles({ components: { pages: [page] }, context });
  expect(context.errors).toEqual([]);
  expect(page.slots.content.blocks[0].style).toEqual({
    block: operatorSlot,
    element: { padding: '8px 4px', color: { _state: 'color' } },
  });
});

test('validateMobileStyles checks literal values next to operators', () => {
  const context = createContext();
  const page = createPage({
    target: 'mobile',
    style: { element: { cursor: 'pointer', color: { _state: 'color' } } },
  });
  validateMobileStyles({ components: { pages: [page] }, context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Style "cursor" in slot "element" on block "card" on page "home" is not supported on mobile. "cursor" is web-only: phones have no mouse pointer.',
  ]);
  expect(context.errors[0].configKey).toBe('k1');
});

test('validateMobileStyles checks shared pages without changing the JSON the web reads', () => {
  const context = createContext();
  const page = createPage({ target: 'both', style: { block: { padding: '8px 24px' } } });
  validateMobileStyles({ components: { pages: [page] }, context });
  expect(context.errors).toEqual([]);
  expect(page.slots.content.blocks[0].style).toEqual({ block: { padding: '8px 24px' } });

  const refused = createPage({ target: 'both', style: { block: { position: 'fixed' } } });
  validateMobileStyles({ components: { pages: [refused] }, context });
  expect(context.errors).toHaveLength(1);
});

test('validateMobileStyles ignores web pages', () => {
  const context = createContext();
  const page = createPage({ target: undefined, style: { block: { display: 'grid' } } });
  validateMobileStyles({ components: { pages: [page] }, context });
  expect(context.errors).toEqual([]);
  expect(page.slots.content.blocks[0].style).toEqual({ block: { display: 'grid' } });
});
