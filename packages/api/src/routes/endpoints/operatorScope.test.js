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

import operatorScope from './operatorScope.js';

test('operatorScope returns the operator fields of the routine context', () => {
  const error = new Error('Caught error.');
  const routineContext = {
    arrayIndices: [1],
    endpointDepth: 2,
    error,
    items: { item: 1 },
    payload: { payload: true },
    state: { state: true },
    steps: { steps: true },
  };
  const scope = operatorScope(routineContext);
  expect(scope).toEqual({
    error,
    items: { item: 1 },
    payload: { payload: true },
    state: { state: true },
    steps: { steps: true },
  });
  expect(scope.error).toBe(error);
});

test('operatorScope returns error null when the routine context has no error', () => {
  const scope = operatorScope({ items: {}, payload: {}, state: {}, steps: {} });
  expect(scope.error).toBeNull();
});
