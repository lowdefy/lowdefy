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

import httpFetch from '../../../utils/httpFetch.js';
import readResponseBody from '../../../utils/readResponseBody.js';

// Listing a page's mutants builds the page first, which takes seconds; five minutes means the dev
// server has stopped answering.
const MUTANTS_TIMEOUT_MS = 5 * 60 * 1000;

// POST /lowdefy-docs/mutants on the dev server: lists the mutants on the
// pages, requests, endpoints and app events in `body`, as { buildId,
// artifacts, ids, mutants }. A failed response's error carries the response
// `status`, so a caller can tell a page that fails to build (422).
async function postMutants({ url, body }) {
  let response;
  let data;
  try {
    response = await httpFetch({
      url: `${url}/lowdefy-docs/mutants`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: MUTANTS_TIMEOUT_MS,
    });
    data = await readResponseBody(response);
  } catch (error) {
    throw new Error(`Could not reach the dev server: ${error.message}`, { cause: error });
  }
  if (response.status === 404) {
    throw new Error(
      'The dev server has no mutants route (POST /lowdefy-docs/mutants): it needs a newer Lowdefy.'
    );
  }
  if (!response.ok) {
    const error = new Error(
      `POST /lowdefy-docs/mutants responded ${response.status}: ${JSON.stringify(data)}`
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

export default postMutants;
