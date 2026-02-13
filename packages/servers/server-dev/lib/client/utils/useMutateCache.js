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

import { useSWRConfig } from 'swr';

let reloadVersion = 0;

function getReloadVersion() {
  return reloadVersion;
}

function useMutateCache(basePath) {
  const { mutate } = useSWRConfig();
  return () => {
    // Increment the reload version so that usePageConfig SWR keys change.
    // Old cached page entries become orphaned (different key), forcing fresh
    // fetches when navigating to any page after a reload.
    reloadVersion += 1;
    // Revalidate root config in the background (stale-while-revalidate, no suspend).
    return mutate((key) => key === `${basePath}/api/root`);
  };
}

export { getReloadVersion };
export default useMutateCache;
