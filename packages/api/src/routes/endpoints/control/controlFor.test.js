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

import runTest from '../test/runTest.js';

test('for with missing :in', async () => {
  const routine = {
    ':for': 'i',
    ':do:': [{ ':return': { message: 'for loop' } }],
  };
  const { res, context } = await runTest({ routine });
  const error = new Error('Invalid :for - missing variable name in :for.');
  expect(res.status).toEqual('error');
  expect(res.error).toEqual(error);
  expect(context.logger.debug.mock.calls).toEqual([[{ event: 'debug_control_for' }]]);
  expect(context.logger.error.mock.calls).toEqual([[error]]);
});
