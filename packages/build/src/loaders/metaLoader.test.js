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

import createGetMeta from '../utils/meta/getMeta';
import createMetaLoader from './metaLoader';

jest.mock('../utils/meta/getMeta', () => {
  const mockGetMeta = jest.fn();
  return () => mockGetMeta;
});

const mockGetMeta = createGetMeta();

mockGetMeta.mockImplementation((type) => {
  if (type === 'Type1') {
    return {
      type: 'Type1',
      meta: {
        key: 'value1',
      },
    };
  }
  if (type === 'Type2') {
    return {
      type: 'Type2',
      meta: {
        key: 'value2',
      },
    };
  }
  throw new Error('Not found.');
});

const loaderConfig = {
  components: { types: {} },
  context: { cacheDirectory: 'cacheDirectory' },
};

test('load meta', async () => {
  const metaLoader = createMetaLoader(loaderConfig);
  const res = await metaLoader.load('Type1');
  expect(res).toEqual({
    key: 'value1',
  });
});

test('load meta, meta does not exist', async () => {
  const metaLoader = createMetaLoader(loaderConfig);
  await expect(metaLoader.load('DoesNotExist')).rejects.toThrow('Not found.');
});

test('load two files', async () => {
  const metaLoader = createMetaLoader(loaderConfig);
  const types = ['Type1', 'Type2'];
  const res = await Promise.all(types.map((type) => metaLoader.load(type)));
  expect(res).toEqual([
    {
      key: 'value1',
    },
    {
      key: 'value2',
    },
  ]);
});

test('load two meta, one does not exist', async () => {
  const metaLoader = createMetaLoader(loaderConfig);
  const types = ['Type1', 'DoesNotExist'];
  await expect(Promise.all(types.map((type) => metaLoader.load(type)))).rejects.toThrow(
    'Not found.'
  );
});
