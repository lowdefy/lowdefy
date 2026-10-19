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

import flagTypesOutsidePage from './flagTypesOutsidePage.js';

const pageTypeSets = {
  home: { actions: ['SetState'], blocks: ['Box', 'Button'], operators: ['_state'] },
};

function usedTypes({ actions = [], blocks = [], operators = [] }) {
  return { actions: new Set(actions), blocks: new Set(blocks), operators: new Set(operators) };
}

test('flagTypesOutsidePage leaves a page alone when its fragments stay within its types', () => {
  const context = { logger: { warn: jest.fn() } };
  const pageConfig = { pageId: 'home' };
  flagTypesOutsidePage(context, {
    pageConfig,
    pageTypeSets,
    usedTypes: usedTypes({ blocks: ['Button'], operators: ['_state'] }),
  });
  expect(pageConfig.loadAllTypes).toBeUndefined();
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('flagTypesOutsidePage asks for the full type set and names the undeclared types', () => {
  const context = { logger: { warn: jest.fn() } };
  const pageConfig = { pageId: 'home' };
  flagTypesOutsidePage(context, {
    pageConfig,
    pageTypeSets,
    usedTypes: usedTypes({ blocks: ['Card'], operators: ['_state', '_if'] }),
  });
  expect(pageConfig.loadAllTypes).toBe(true);
  expect(context.logger.warn.mock.calls[0][0]).toEqual({
    event: 'dynamic_types_outside_page',
    pageId: 'home',
    types: ['Card', '_if'],
  });
});

test('flagTypesOutsidePage does nothing in dev, where the client bundles every type', () => {
  const context = { logger: { warn: jest.fn() } };
  const pageConfig = { pageId: 'home' };
  flagTypesOutsidePage(context, {
    pageConfig,
    pageTypeSets: null,
    usedTypes: usedTypes({ blocks: ['Card'] }),
  });
  expect(pageConfig.loadAllTypes).toBeUndefined();
});
