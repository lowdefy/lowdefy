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

import axios from 'axios';

// The id of the build the dev server serves, recorded with the measured paths
// so a reader can tell which config they describe. Null when the server does
// not report one.
async function fetchBuildId({ url }) {
  try {
    const response = await axios.get(`${url}/lowdefy-docs/build-status`, { timeout: 5000 });
    return response.data?.buildId ?? null;
  } catch {
    return null;
  }
}

export default fetchBuildId;
