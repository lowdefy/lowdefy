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

import validateDynamicBlockRefs from './validateDynamicBlockRefs.js';

const mockHandleWarning = jest.fn();

beforeEach(() => {
  mockHandleWarning.mockReset();
});

const context = {
  handleWarning: mockHandleWarning,
};

test('Dynamic block referencing an Api endpoint produces no warning', () => {
  const dynamicBlockRefs = [
    {
      endpointId: 'resolve_section',
      block: { blockId: 'section_1', type: 'Dynamic' },
      sourcePageId: 'page1',
    },
  ];
  const endpointConfigs = [{ endpointId: 'resolve_section', type: 'Api' }];
  validateDynamicBlockRefs({ dynamicBlockRefs, endpointConfigs, context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});

test('Dynamic block referencing an InternalApi endpoint produces no warning', () => {
  const dynamicBlockRefs = [
    {
      endpointId: 'resolve_section',
      block: { blockId: 'section_1', type: 'Dynamic' },
      sourcePageId: 'page1',
    },
  ];
  const endpointConfigs = [{ endpointId: 'resolve_section', type: 'InternalApi' }];
  validateDynamicBlockRefs({ dynamicBlockRefs, endpointConfigs, context });
  expect(mockHandleWarning).not.toHaveBeenCalled();
});

test('Dynamic block referencing a non-existent endpoint produces prodError warning', () => {
  const dynamicBlockRefs = [
    {
      endpointId: 'missing_endpoint',
      block: { blockId: 'section_1', type: 'Dynamic' },
      sourcePageId: 'page1',
    },
  ];
  const endpointConfigs = [{ endpointId: 'resolve_section', type: 'Api' }];
  validateDynamicBlockRefs({ dynamicBlockRefs, endpointConfigs, context });
  expect(mockHandleWarning).toHaveBeenCalledTimes(1);
  const warning = mockHandleWarning.mock.calls[0][0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toBe(
    'Dynamic block "section_1" on page "page1" references non-existent endpoint "missing_endpoint". ' +
      'Check the endpointId for typos, or add an Api endpoint with id "missing_endpoint".'
  );
  expect(warning.prodError).toBe(true);
  expect(warning.checkSlug).toBe('dynamic-endpoint-refs');
});
