/*
  Copyright 2020 Lowdefy, Inc

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

import path from 'path';
import createComponentLoader from './componentLoader';
import { ConfigurationError } from '../context/errors';

const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');

test('load component', async () => {
  const componentLoader = createComponentLoader({ CONFIGURATION_BASE_PATH });
  const res = await componentLoader.load('global');
  expect(res).toEqual({
    global: 'value',
  });
});

test('load component, component does not exist', async () => {
  const componentLoader = createComponentLoader({ CONFIGURATION_BASE_PATH });
  const res = await componentLoader.load('doesNotExist');
  expect(res).toEqual(null);
});

test('load component, invalid JSON', async () => {
  const componentLoader = createComponentLoader({ CONFIGURATION_BASE_PATH });
  await expect(componentLoader.load('invalid')).rejects.toThrow(ConfigurationError);
});
