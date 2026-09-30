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
import { ConfigWarning } from '@lowdefy/errors';

import validateWebsocketRefs from './validateWebsocketRefs.js';

const mockHandleWarning = jest.fn();

beforeEach(() => {
  mockHandleWarning.mockReset();
});

const context = {
  handleWarning: mockHandleWarning,
};

test('Subscribe action referencing an existing websocket produces no warning', () => {
  const websocketActionRefs = [
    {
      websocketId: 'ws1',
      action: { id: 'subscribe_1', type: 'Subscribe', params: 'ws1' },
      actionType: 'Subscribe',
      sourcePageId: 'page1',
    },
  ];
  validateWebsocketRefs({ websocketActionRefs, websocketIds: new Set(['ws1']), context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});

test('Subscribe action referencing a non-existent websocket produces warning with prodError', () => {
  const websocketActionRefs = [
    {
      websocketId: 'missing_ws',
      action: {
        id: 'subscribe_1',
        type: 'Subscribe',
        params: 'missing_ws',
        '~k': 'pages.page1.events.onClick.0',
      },
      actionType: 'Subscribe',
      sourcePageId: 'page1',
    },
  ];
  validateWebsocketRefs({ websocketActionRefs, websocketIds: new Set(['ws1']), context });
  expect(mockHandleWarning).toHaveBeenCalledTimes(1);
  const warning = mockHandleWarning.mock.calls[0][0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toBe(
    'Subscribe action on page "page1" references non-existent websocket "missing_ws". ' +
      'Check the websocketId for typos, or add a websocket with id "missing_ws" to the app config.'
  );
  expect(warning.configKey).toBe('pages.page1.events.onClick.0');
  expect(warning.prodError).toBe(true);
  expect(warning.checkSlug).toBe('websocket-refs');
});

test('Publish action referencing a non-existent websocket produces warning naming the action type', () => {
  const websocketActionRefs = [
    {
      websocketId: 'missing_ws',
      action: {
        id: 'publish_1',
        type: 'Publish',
        params: { websocketId: 'missing_ws' },
      },
      actionType: 'Publish',
      sourcePageId: 'page2',
    },
  ];
  validateWebsocketRefs({ websocketActionRefs, websocketIds: new Set(), context });
  expect(mockHandleWarning).toHaveBeenCalledTimes(1);
  const warning = mockHandleWarning.mock.calls[0][0];
  expect(warning.message).toBe(
    'Publish action on page "page2" references non-existent websocket "missing_ws". ' +
      'Check the websocketId for typos, or add a websocket with id "missing_ws" to the app config.'
  );
});

test('skipped action referencing a non-existent websocket is not validated', () => {
  const websocketActionRefs = [
    {
      websocketId: 'missing_ws',
      action: {
        id: 'subscribe_1',
        type: 'Subscribe',
        skip: true,
        params: 'missing_ws',
      },
      actionType: 'Subscribe',
      sourcePageId: 'page1',
    },
  ];
  validateWebsocketRefs({ websocketActionRefs, websocketIds: new Set(['ws1']), context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});

test('action with a non-boolean skip value is still validated', () => {
  const websocketActionRefs = [
    {
      websocketId: 'missing_ws',
      action: {
        id: 'subscribe_1',
        type: 'Subscribe',
        skip: { _state: 'skip' },
        params: 'missing_ws',
      },
      actionType: 'Subscribe',
      sourcePageId: 'page1',
    },
  ];
  validateWebsocketRefs({ websocketActionRefs, websocketIds: new Set(['ws1']), context });
  expect(mockHandleWarning).toHaveBeenCalledTimes(1);
});

test('empty refs produce no warnings', () => {
  validateWebsocketRefs({ websocketActionRefs: [], websocketIds: new Set(), context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});
