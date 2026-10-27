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

import { expect, test } from 'vitest';
import validateNativeIgnoredProperties from './validateNativeIgnoredProperties.js';
import testContext from '../../test-utils/testContext.js';

function createContext() {
  const context = testContext();
  context.warnings = [];
  context.blockMetasMobile = {
    Card: { category: 'container', nativeIgnored: ['hoverable'] },
    Selector: { category: 'input', nativeIgnored: ['label.align', 'options.$.style'] },
    Box: { category: 'container' },
  };
  return context;
}

function createPage({ pageId = 'home', target = 'mobile', blocks }) {
  return { pageId, blockId: pageId, type: 'Screen', target, slots: { content: { blocks } } };
}

function messages(context) {
  return context.warnings.map((warning) => warning.message);
}

test('a mobile page that sets a nativeIgnored property warns, naming page, block and property', () => {
  const context = createContext();
  const page = createPage({
    blocks: [{ blockId: 'card', type: 'Card', properties: { hoverable: true }, '~k': 'k1' }],
  });
  validateNativeIgnoredProperties({ components: { pages: [page] }, context });
  expect(messages(context)).toEqual([
    'Property "hoverable" on block "card" (Card) on page "home" is ignored on mobile.',
  ]);
  expect(context.warnings[0].configKey).toBe('k1');
  expect(context.warnings[0].checkSlug).toBe('native-ignored');
});

test('it warns once per page for each property, nested and array paths included', () => {
  const context = createContext();
  const blocks = [
    { blockId: 'a', type: 'Card', properties: { hoverable: true } },
    { blockId: 'b', type: 'Card', properties: { hoverable: false } },
    {
      blockId: 'colour',
      type: 'Selector',
      properties: {
        label: { align: 'right' },
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Blue', value: 'blue', style: {} },
        ],
      },
    },
    {
      blockId: 'group',
      type: 'Box',
      blocks: [{ blockId: 'c', type: 'Card', properties: { hoverable: true } }],
    },
  ];
  validateNativeIgnoredProperties({
    components: {
      pages: [createPage({ blocks }), createPage({ pageId: 'other', target: 'both', blocks })],
    },
    context,
  });
  expect(messages(context)).toEqual([
    'Property "hoverable" on block "a" (Card) on page "home" is ignored on mobile.',
    'Property "label.align" on block "colour" (Selector) on page "home" is ignored on mobile.',
    'Property "options.$.style" on block "colour" (Selector) on page "home" is ignored on mobile.',
    'Property "hoverable" on block "a" (Card) on page "other" is ignored on mobile.',
    'Property "label.align" on block "colour" (Selector) on page "other" is ignored on mobile.',
    'Property "options.$.style" on block "colour" (Selector) on page "other" is ignored on mobile.',
  ]);
});

test('web pages, unset properties and paths below an operator do not warn', () => {
  const context = createContext();
  validateNativeIgnoredProperties({
    components: {
      pages: [
        createPage({
          target: 'web',
          blocks: [{ blockId: 'card', type: 'Card', properties: { hoverable: true } }],
        }),
        createPage({
          blocks: [
            { blockId: 'card', type: 'Card', properties: { title: 'Hi' } },
            { blockId: 'colour', type: 'Selector', properties: { label: { _state: 'label' } } },
            { blockId: 'box', type: 'Box', properties: { hoverable: true } },
          ],
        }),
      ],
    },
    context,
  });
  expect(context.warnings).toEqual([]);
});
