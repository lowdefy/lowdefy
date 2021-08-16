/*
  Copyright 2020-2021 Lowdefy, Inc

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

import build from './build';
// eslint-disable-next-line no-unused-vars
import getFederatedModule from '../../utils/getFederatedModule';
import startUp from '../../utils/startUp';

jest.mock('../../utils/getFederatedModule', () => {
  const buildScript = jest.fn();
  return () => {
    return { default: buildScript };
  };
});

jest.mock('../../utils/startUp');

test('build', async () => {
  const context = {};
  await startUp({ context, options: {}, command: {} });
  await build({ context });

  const { default: buildScript } = getFederatedModule();
  expect(buildScript).toHaveBeenCalledTimes(1);
  expect(buildScript.mock.calls[0][0].outputDirectory).toEqual('baseDirectory/outputDirectory');
  expect(buildScript.mock.calls[0][0].cacheDirectory).toEqual('baseDirectory/cacheDirectory');
});
