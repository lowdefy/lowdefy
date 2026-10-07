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

// POST /lowdefy-docs/mutants on the dev server: lists the mutants on the
// pages, requests, endpoints and app events in `body`, as { buildId,
// artifacts, ids, mutants }.
async function postMutants({ url, body }) {
  try {
    const response = await axios.post(`${url}/lowdefy-docs/mutants`, body);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        'The dev server has no mutants route (POST /lowdefy-docs/mutants): it needs a newer Lowdefy.'
      );
    }
    if (error.response) {
      throw new Error(
        `POST /lowdefy-docs/mutants responded ${error.response.status}: ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw new Error(`Could not reach the dev server: ${error.message}`);
  }
}

export default postMutants;
