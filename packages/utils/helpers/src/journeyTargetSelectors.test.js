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

import journeyTargetSelectors from './journeyTargetSelectors.js';

test('journeyTargetSelectors interactiveControl lists every control the journey runner clicks', () => {
  expect(journeyTargetSelectors.interactiveControl).toBe(
    [
      'button',
      '[role="button"]',
      'a[href]',
      'label:has(input[type="radio"])',
      'label:has(input[type="checkbox"])',
      'input:not([type="hidden"]):not(label input[type="radio"]):not(label input[type="checkbox"])',
      'textarea',
      'select',
      '[role="switch"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="tab"]',
      '[role="menuitem"]',
    ].join(', ')
  );
});

test('journeyTargetSelectors names the wrapper prefix, grid attributes, layers and options', () => {
  expect(journeyTargetSelectors).toMatchObject({
    blockWrapperPrefix: 'bl-',
    cellAttribute: 'col-id',
    dropdownOption: '.ant-select-item-option, [role="option"]',
    layers: ['[role="menu"]', '[role="dialog"]'],
    rowAttribute: 'row-index',
  });
});
