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

import resolveServer from '../resolveServer.js';

// The dev build is just-in-time: a page's built config is on disk only once
// something asked for it. L7 reads page config from the build directory, so
// each page is built first through the dev server (reused, or started and
// stopped here). Returns { pageId: error } for the pages that could not be
// built.
async function buildL7Pages({ context, pageIds }) {
  const pageErrors = {};
  const server = await resolveServer({ context });
  try {
    for (const pageId of pageIds) {
      try {
        const response = await axios.get(
          `${server.url}/lowdefy-docs/page-config/${encodeURIComponent(pageId)}`,
          { timeout: 60000 }
        );
        if (response.data?.buildError === true) {
          const messages = (response.data.errors ?? []).map(({ message }) => message);
          pageErrors[pageId] = `Its build failed: ${messages.join(' ')}`;
        }
      } catch (error) {
        const status = error.response ? ` (${error.response.status})` : '';
        pageErrors[pageId] = `GET /lowdefy-docs/page-config/${pageId} failed${status}: ${
          error.response?.data?.error ?? error.message
        }`;
      }
    }
  } finally {
    await server.stop();
  }
  return pageErrors;
}

export default buildL7Pages;
