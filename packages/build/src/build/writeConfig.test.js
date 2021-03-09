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

import writeConfig from './writeConfig';
import testContext from '../test/testContext';

const mockSet = jest.fn();

const artifactSetter = {
  set: mockSet,
};

const context = testContext({ artifactSetter });

beforeEach(() => {
  mockSet.mockReset();
});

test('writeConfig', async () => {
  const components = {
    config: {
      key: 'value',
    },
  };
  await writeConfig({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'config.json',
        content: `{
  "key": "value"
}`,
      },
    ],
  ]);
});

test('writeConfig empty config', async () => {
  const components = {
    config: {},
  };
  await writeConfig({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'config.json',
        content: `{}`,
      },
    ],
  ]);
});

test('writeConfig config undefined', async () => {
  const components = {};
  await writeConfig({ components, context });
  expect(mockSet.mock.calls).toEqual([
    [
      {
        filePath: 'config.json',
        content: `{}`,
      },
    ],
  ]);
});

test('writeConfig config not an object', async () => {
  const components = {
    config: 'config',
  };
  await expect(writeConfig({ components, context })).rejects.toThrow('Config is not an object.');
});

test('writeConfig config error when both protected and public pages are listed.', async () => {
  const components = {
    config: {
      auth: {
        pages: {
          protected: [],
          public: [],
        },
      },
    },
  };
  await expect(writeConfig({ components, context })).rejects.toThrow(
    'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa. Use only the one or the other.'
  );
});
