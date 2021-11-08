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

import path from 'path';
import createFetchMetaCache from './fetchMetaCache.js';

const cacheDirectory = path.resolve(process.cwd(), 'src/test/fetchMetaCache');
const fetchMetaCache = createFetchMetaCache({ cacheDirectory });

test('fetchMetaCache fetches from cache', async () => {
  const meta = await fetchMetaCache({ url: 'cachekey.json' });
  expect(meta).toEqual({
    moduleFederation: {
      remoteEntryUrl:
        'https://unpkg.com/@lowdefy/blocks-antd@1.0.0-experimental.1/dist/remoteEntry.js',
      scope: 'lowdefy_blocks_antd',
      module: 'Button',
    },
    category: 'display',
    loading: {
      type: 'SkeletonButton',
    },
    schema: {},
  });
});

test('fetchMetaCache returns null if not found', async () => {
  const meta = await fetchMetaCache({ url: 'doesNotExist.json' });
  expect(meta).toEqual(null);
});
