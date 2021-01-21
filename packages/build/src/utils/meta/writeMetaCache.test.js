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

import fs from 'fs';
import path from 'path';
import createWriteMetaCache from './writeMetaCache';

const cacheDirectory = path.resolve(process.cwd(), 'src/test/fetchMetaCache');
const writeMetaCache = createWriteMetaCache({ cacheDirectory });

test('writeMetaCache writes to cache', async () => {
  const filePath = path.resolve(cacheDirectory, 'meta/', 'writemetacache.json');
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    //pass
  }
  expect(fs.existsSync(filePath)).toBe(false);
  await writeMetaCache({
    location: { url: 'writemetacache.json' },
    meta: {
      key: 'value',
    },
  });
  const content = fs.readFileSync(filePath, 'utf8');
  expect(content).toEqual(`{
  "key": "value"
}`);
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    //pass
  }
});
