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

const originalHome = process.env.LOWDEFY_HOME;

afterEach(() => {
  if (originalHome === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = originalHome;
  }
});

test('getLowdefyHome is ~/.lowdefy by default', () => {
  delete process.env.LOWDEFY_HOME;
  expect(getLowdefyHome()).toBe(path.join(os.homedir(), '.lowdefy'));
});

test('getLowdefyHome follows LOWDEFY_HOME', () => {
  process.env.LOWDEFY_HOME = '/tmp/lowdefy-home-test';
  expect(getLowdefyHome()).toBe('/tmp/lowdefy-home-test');
});
