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
import path from 'path';

import getLowdefyHome from './getLowdefyHome.js';
import getServerRegistryDirectory from './getServerRegistryDirectory.js';

const saved = process.env.LOWDEFY_HOME;

afterEach(() => {
  if (saved === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = saved;
  }
});

test('getLowdefyHome defaults to .lowdefy in the home directory', () => {
  delete process.env.LOWDEFY_HOME;
  expect(getLowdefyHome()).toEqual(path.join(os.homedir(), '.lowdefy'));
});

test('getLowdefyHome follows LOWDEFY_HOME, and the server registry lives under it', () => {
  process.env.LOWDEFY_HOME = '/tmp/lowdefy-home';
  expect(getLowdefyHome()).toEqual('/tmp/lowdefy-home');
  expect(getServerRegistryDirectory()).toEqual(path.join('/tmp/lowdefy-home', 'servers'));
});
