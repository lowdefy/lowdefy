/*
  Copyright 2020-2024 Lowdefy, Inc

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

import validateLinkReferences from './validateLinkReferences.js';

describe('validateLinkReferences', () => {
  const createContext = (stage = 'dev') => {
    const warnFn = jest.fn();
    const context = {
      stage,
      logger: {
        warn: (params) => {
          if (params.prodError && context.stage === 'prod') {
            throw new Error(params.message);
          }
          warnFn(params.message);
        },
      },
      directories: {
        config: '/test',
      },
      keyMap: {},
      refMap: {},
      warnFn, // Expose for test assertions
    };
    return context;
  };

  test('validates successfully when page exists', () => {
    const context = createContext();

    const linkActionRefs = [
      {
        pageId: 'homePage',
        action: { type: 'Link', params: 'homePage', '~k': 'key-1' },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('warns in dev mode when page not found', () => {
    const context = createContext('dev');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: { type: 'Link', params: 'nonExistentPage', '~k': 'key-1' },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Page "nonExistentPage" not found')
    );
  });

  test('throws in prod mode when page not found', () => {
    const context = createContext('prod');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: { type: 'Link', params: 'nonExistentPage', '~k': 'key-1' },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    expect(() =>
      validateLinkReferences({
        linkActionRefs,
        pageIds,
        context,
      })
    ).toThrow('Page "nonExistentPage" not found');
  });

  test('skips validation when skip is explicitly true', () => {
    const context = createContext('prod');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: {
          type: 'Link',
          params: 'nonExistentPage',
          skip: true,
          '~k': 'key-1',
        },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    // Should not throw because skip is explicitly true
    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('validates normally when skip is an operator object', () => {
    const context = createContext('dev');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: {
          type: 'Link',
          params: 'nonExistentPage',
          skip: {
            _eq: [{ _ref: { path: 'app_config.yaml', key: 'app_name' } }, 'support'],
          },
          '~k': 'key-1',
        },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    // Should warn even with operator object - page must exist in app
    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Page "nonExistentPage" not found')
    );
  });

  test('validates normally when skip is false', () => {
    const context = createContext('dev');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: {
          type: 'Link',
          params: 'nonExistentPage',
          skip: false,
          '~k': 'key-1',
        },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    // Should warn because skip: false means validation runs
    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Page "nonExistentPage" not found')
    );
  });

  test('validates normally when skip is undefined', () => {
    const context = createContext('dev');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: {
          type: 'Link',
          params: 'nonExistentPage',
          skip: undefined,
          '~k': 'key-1',
        },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    // Should warn because skip: undefined means validation runs
    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
  });

  test('validates normally when skip is empty object', () => {
    const context = createContext('dev');

    const linkActionRefs = [
      {
        pageId: 'nonExistentPage',
        action: {
          type: 'Link',
          params: 'nonExistentPage',
          skip: {},
          '~k': 'key-1',
        },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    // Should warn even with empty object - page must exist
    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
  });

  test('validates multiple link actions with mixed skip conditions', () => {
    const context = createContext('dev');

    const linkActionRefs = [
      {
        pageId: 'homePage',
        action: { type: 'Link', params: 'homePage', '~k': 'key-1' },
        sourcePageId: 'loginPage',
      },
      {
        pageId: 'nonExistentPage1',
        action: {
          type: 'Link',
          params: 'nonExistentPage1',
          skip: true,
          '~k': 'key-2',
        },
        sourcePageId: 'loginPage',
      },
      {
        pageId: 'nonExistentPage2',
        action: {
          type: 'Link',
          params: 'nonExistentPage2',
          '~k': 'key-3',
        },
        sourcePageId: 'loginPage',
      },
      {
        pageId: 'nonExistentPage3',
        action: {
          type: 'Link',
          params: 'nonExistentPage3',
          skip: { _eq: ['a', 'b'] },
          '~k': 'key-4',
        },
        sourcePageId: 'loginPage',
      },
    ];

    const pageIds = ['loginPage', 'homePage'];

    validateLinkReferences({
      linkActionRefs,
      pageIds,
      context,
    });

    // nonExistentPage2 and nonExistentPage3 should trigger warnings
    // (skip: true is skipped, operator object is NOT skipped)
    expect(context.warnFn).toHaveBeenCalledTimes(2);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Page "nonExistentPage2" not found')
    );
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Page "nonExistentPage3" not found')
    );
  });

  test('handles empty arrays', () => {
    const context = createContext();

    validateLinkReferences({
      linkActionRefs: [],
      pageIds: [],
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('handles no link actions', () => {
    const context = createContext();

    validateLinkReferences({
      linkActionRefs: [],
      pageIds: ['loginPage', 'homePage'],
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });
});
