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

import validateRequestReferences from './validateRequestReferences.js';

describe('validateRequestReferences', () => {
  const createContext = (stage = 'dev') => {
    const warnFn = jest.fn();
    const context = {
      stage,
      logger: {
        warn: jest.fn(),
      },
      handleWarning: (params) => {
        if (params.prodError && context.stage === 'prod') {
          throw new Error(params.message);
        }
        warnFn(params.message);
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

  test('validates successfully when request exists on page', () => {
    const context = createContext();

    const requestActionRefs = [
      {
        requestId: 'myRequest',
        action: { type: 'Request', params: 'myRequest', '~k': 'key-1' },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('warns in dev mode when request not defined on page', () => {
    const context = createContext('dev');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: { type: 'Request', params: 'undefinedRequest', '~k': 'key-1' },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Request "undefinedRequest" not defined on page "testPage"')
    );
  });

  test('throws in prod mode when request not defined on page', () => {
    const context = createContext('prod');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: { type: 'Request', params: 'undefinedRequest', '~k': 'key-1' },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    expect(() =>
      validateRequestReferences({
        requestActionRefs,
        requests,
        pageId: 'testPage',
        context,
      })
    ).toThrow('Request "undefinedRequest" not defined on page "testPage"');
  });

  test('skips validation when action has skip: true', () => {
    const context = createContext('prod');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: {
          type: 'Request',
          params: 'undefinedRequest',
          skip: true,
          '~k': 'key-1',
        },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    // Should not throw even in prod mode because action has skip: true
    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('skips validation when skip is an operator object', () => {
    const context = createContext('prod');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: {
          type: 'Request',
          params: 'undefinedRequest',
          skip: {
            _eq: [{ _ref: { path: 'app_config.yaml', key: 'app_name' } }, 'support'],
          },
          '~k': 'key-1',
        },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    // Should not throw even in prod mode because skip is an object
    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('validates normally when skip is false', () => {
    const context = createContext('dev');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: {
          type: 'Request',
          params: 'undefinedRequest',
          skip: false,
          '~k': 'key-1',
        },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    // Should warn because skip: false should validate normally
    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Request "undefinedRequest" not defined')
    );
  });

  test('validates normally when skip is undefined', () => {
    const context = createContext('dev');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: {
          type: 'Request',
          params: 'undefinedRequest',
          skip: undefined,
          '~k': 'key-1',
        },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    // Should warn because skip: undefined should validate normally
    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).toHaveBeenCalledTimes(1);
  });

  test('skips validation when skip is empty object', () => {
    const context = createContext('prod');

    const requestActionRefs = [
      {
        requestId: 'undefinedRequest',
        action: {
          type: 'Request',
          params: 'undefinedRequest',
          skip: {},
          '~k': 'key-1',
        },
      },
    ];

    const requests = [{ requestId: 'myRequest' }];

    // Should not throw because skip is an object (even if empty)
    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('validates multiple request actions with mixed skip conditions', () => {
    const context = createContext('dev');

    const requestActionRefs = [
      {
        requestId: 'request1',
        action: { type: 'Request', params: 'request1', '~k': 'key-1' },
      },
      {
        requestId: 'undefinedRequest1',
        action: {
          type: 'Request',
          params: 'undefinedRequest1',
          skip: true,
          '~k': 'key-2',
        },
      },
      {
        requestId: 'undefinedRequest2',
        action: {
          type: 'Request',
          params: 'undefinedRequest2',
          '~k': 'key-3',
        },
      },
      {
        requestId: 'undefinedRequest3',
        action: {
          type: 'Request',
          params: 'undefinedRequest3',
          skip: { _eq: ['a', 'b'] },
          '~k': 'key-4',
        },
      },
    ];

    const requests = [{ requestId: 'request1' }];

    validateRequestReferences({
      requestActionRefs,
      requests,
      pageId: 'testPage',
      context,
    });

    // Only undefinedRequest2 should trigger a warning (no skip condition)
    expect(context.warnFn).toHaveBeenCalledTimes(1);
    expect(context.warnFn).toHaveBeenCalledWith(
      expect.stringContaining('Request "undefinedRequest2" not defined')
    );
  });

  test('handles empty request arrays', () => {
    const context = createContext();

    validateRequestReferences({
      requestActionRefs: [],
      requests: [],
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });

  test('handles requests with no actions', () => {
    const context = createContext();

    validateRequestReferences({
      requestActionRefs: [],
      requests: [{ requestId: 'myRequest' }],
      pageId: 'testPage',
      context,
    });

    expect(context.warnFn).not.toHaveBeenCalled();
  });
});
