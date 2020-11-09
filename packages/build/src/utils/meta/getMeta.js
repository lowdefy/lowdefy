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

import createFetchMetaCache from './fetchMetaCache';
import createWriteMetaCache from './writeMetaCache';
import defaultMetaLocations from './defaultMetaLocations';
import fetchMetaUrl from './fetchMetaUrl';

function createGetMeta({ types, cacheDirectory }) {
  const metaLocations = {
    ...defaultMetaLocations,
    ...types,
  };
  const fetchMetaCache = createFetchMetaCache({ cacheDirectory });
  const writeMetaCache = createWriteMetaCache({ cacheDirectory });
  async function getMeta(type) {
    if (!metaLocations[type]) {
      throw new Error(
        `Type ${JSON.stringify(type)} is not defined. Specify type url in types array.`
      );
    }
    let meta;
    const location = metaLocations[type];
    meta = await fetchMetaCache(location);

    if (meta)
      return {
        type,
        meta,
      };
    meta = await fetchMetaUrl(location);
    if (meta) {
      await writeMetaCache({ location, meta });
      return {
        type,
        meta,
      };
    }
    throw new Error(
      `Meta for type ${type} could not be found at location ${JSON.stringify(location)}.`
    );
  }

  return getMeta;
}

export default createGetMeta;
