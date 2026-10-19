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

import collectIconNames from '@lowdefy/build/collectIconNames';

import flagIconsOutsidePage from './flagIconsOutsidePage.js';

const pageTypeSets = { page1: { icons: ['close', 'edit', 'loading'] } };
const iconImports = ['close', 'delete', 'edit', 'loading', 'Rocket'];

// A page whose Dynamic block resolved to the given content.
function resolvedPage(blocks) {
  return {
    pageId: 'page1',
    type: 'Box',
    properties: { icon: 'edit' },
    slots: { content: { blocks: [{ type: 'Dynamic', slots: { content: { blocks } } }] } },
  };
}

test.each([
  ['an app icon outside the page set', [{ type: 'Icon', properties: { name: 'Rocket' } }], true],
  [
    'an app icon in HTML data-icon outside the page set',
    [{ type: 'Html', properties: { html: '<i data-icon="delete"></i> Delete' } }],
    true,
  ],
  ['only icons in the page set', [{ type: 'Button', properties: { icon: 'close' } }], undefined],
  [
    'names that are not app icons',
    [{ type: 'Button', properties: { icon: 'NotAnIcon', title: 'Submit' } }],
    undefined,
  ],
])('flagIconsOutsidePage for Dynamic content with %s', (_, blocks, expected) => {
  const pageConfig = resolvedPage(blocks);
  flagIconsOutsidePage({ collectIconNames, iconImports, pageConfig, pageTypeSets });
  expect(pageConfig.loadAllIcons).toBe(expected);
});

test('flagIconsOutsidePage leaves dev pages alone, whose client bundles every icon', () => {
  const pageConfig = resolvedPage([{ type: 'Icon', properties: { name: 'Rocket' } }]);
  flagIconsOutsidePage({ collectIconNames, iconImports, pageConfig, pageTypeSets: null });
  expect(pageConfig.loadAllIcons).toBeUndefined();
});
