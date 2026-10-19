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

import os from 'os';

import runGit from './runGit.js';

test('runGit passes env over the process environment to git', async () => {
  const value = await runGit({
    args: ['config', '--get', 'scope.marker'],
    cwd: os.tmpdir(),
    env: {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'scope.marker',
      GIT_CONFIG_VALUE_0: 'from-env',
    },
  });

  expect(value).toEqual('from-env');
});

test('runGit throws with the failing command and git message', async () => {
  await expect(
    runGit({ args: ['rev-parse', '--verify', 'no-such-ref'], cwd: os.tmpdir() })
  ).rejects.toThrow('git rev-parse --verify no-such-ref failed:');
});
