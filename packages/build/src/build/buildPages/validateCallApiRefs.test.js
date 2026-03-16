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

import validateCallApiRefs from './validateCallApiRefs.js';

const mockHandleWarning = jest.fn();

beforeEach(() => {
  mockHandleWarning.mockReset();
});

const context = {
  handleWarning: mockHandleWarning,
};

test('CallAPI targeting Api endpoint produces no warning', () => {
  const callApiActionRefs = [
    {
      endpointId: 'public_api',
      action: { id: 'call_1', type: 'CallAPI', params: { endpointId: 'public_api' } },
      sourcePageId: 'page1',
    },
  ];
  const endpointConfigs = [{ endpointId: 'public_api', type: 'Api' }];
  validateCallApiRefs({ callApiActionRefs, endpointConfigs, context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});

test('CallAPI targeting InternalApi endpoint produces warning', () => {
  const callApiActionRefs = [
    {
      endpointId: 'internal_api',
      action: { id: 'call_1', type: 'CallAPI', params: { endpointId: 'internal_api' } },
      sourcePageId: 'page1',
    },
  ];
  const endpointConfigs = [{ endpointId: 'internal_api', type: 'InternalApi' }];
  validateCallApiRefs({ callApiActionRefs, endpointConfigs, context });
  expect(mockHandleWarning).toHaveBeenCalledTimes(1);
  const warning = mockHandleWarning.mock.calls[0][0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toContain('InternalApi endpoint "internal_api"');
  expect(warning.message).toContain('page "page1"');
  expect(warning.prodError).toBe(true);
  expect(warning.checkSlug).toBe('callapi-internal-refs');
});

test('skipped action is not validated', () => {
  const callApiActionRefs = [
    {
      endpointId: 'internal_api',
      action: {
        id: 'call_1',
        type: 'CallAPI',
        skip: true,
        params: { endpointId: 'internal_api' },
      },
      sourcePageId: 'page1',
    },
  ];
  const endpointConfigs = [{ endpointId: 'internal_api', type: 'InternalApi' }];
  validateCallApiRefs({ callApiActionRefs, endpointConfigs, context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});

test('empty refs and configs produce no warnings', () => {
  validateCallApiRefs({ callApiActionRefs: [], endpointConfigs: [], context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});
