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
import CallMethod from './CallMethod.js';

const mockCallMethod = jest.fn();
const methods = { callMethod: mockCallMethod };

test('CallMethod mock test', () => {
  CallMethod({
    methods,
    params: { blockId: 'blockId', method: 'method', args: ['arg1', 'arg2'] },
  });
  expect(mockCallMethod.mock.calls).toEqual([
    [{ blockId: 'blockId', method: 'method', args: ['arg1', 'arg2'] }],
  ]);
});
