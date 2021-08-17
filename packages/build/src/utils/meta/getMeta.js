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

/*
Steps to fetch meta
- check in cache
  - in cache
    - return
  - not in cache
    - fetch url
    - write cache
    - return
*/

import { type as typeHelper } from '@lowdefy/helpers';
import createFetchMetaCache from './fetchMetaCache';
import createWriteMetaCache from './writeMetaCache';
import metaLocations from './metaLocations';
import fetchMetaUrl from './fetchMetaUrl';

const memoisedMeta = {};

function createGetMeta({ blocksServerUrl, cacheDirectory, types }) {
  const allMetaLocations = {
    ...metaLocations({ blocksServerUrl }),
    ...types,
  };
  const fetchMetaCache = createFetchMetaCache({ cacheDirectory });
  const writeMetaCache = createWriteMetaCache({ cacheDirectory });
  async function getMeta(type) {
    if (memoisedMeta[type]) {
      return memoisedMeta[type];
    }

    const location = allMetaLocations[type];
    if (!location) {
      throw new Error(
        `Block type ${JSON.stringify(type)} is not defined. Specify type url in types array.`
      );
    }

    const cacheMeta = !location.url.startsWith('http://localhost:');
    let meta;

    if (cacheMeta) {
      meta = await fetchMetaCache(location);
      if (meta) {
        memoisedMeta[type] = meta;
        return meta;
      }
    }

    meta = await fetchMetaUrl({ location, type });
    // TODO: implement Ajv schema check. Use testAjvSchema func from @lowdefy/ajv
    if (meta && typeHelper.isString(meta.category) && meta.moduleFederation) {
      memoisedMeta[type] = meta;
      if (cacheMeta) {
        await writeMetaCache({ location, meta });
      }
      return meta;
    }
    throw new Error(
      `Block type ${JSON.stringify(type)} has invalid block meta at ${JSON.stringify(location)}.`
    );
  }

  return getMeta;
}

export default createGetMeta;
