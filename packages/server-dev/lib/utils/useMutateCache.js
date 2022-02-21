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

import { useSWRConfig } from 'swr';

function useMutateCache(basePath) {
  const { cache, mutate } = useSWRConfig();
  return () => {
    const keys = [`${basePath}/api/root`];

    for (const key of cache.keys()) {
      if (key.startsWith(`${basePath}/api/page`)) {
        keys.push(key);
      }
    }
    const mutations = keys.map((key) => mutate(key));
    return Promise.all(mutations);
  };
}

export default useMutateCache;
