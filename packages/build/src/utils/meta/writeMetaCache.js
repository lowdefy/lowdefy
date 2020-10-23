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
import { writeFile } from '@lowdefy/node-utils';
import createCacheKey from './createCacheKey';

function createWriteMetaCache({ cacheDirectory }) {
  async function writeMetaCache({ location, meta }) {
    const cacheKey = createCacheKey(location);
    return writeFile({
      filePath: path.resolve(cacheDirectory, cacheKey),
      content: JSON.stringify(meta, null, 2),
    });
  }
  return writeMetaCache;
}

export default createWriteMetaCache;
