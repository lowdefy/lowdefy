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

import postMutants from './postMutants.js';

const REQUEST_ARTIFACT = /^pages\/(.+)\/requests\/([^/]+)\.json$/;
const PAGE_ARTIFACT = /^pages\/(.+)\.json$/;
const ENDPOINT_ARTIFACT = /^api\/(.+)\.json$/;

// The listing body that reads exactly these artifact paths.
function listingBody({ artifacts }) {
  const body = { pages: [], requests: [], endpoints: [], appEvents: false };
  artifacts.forEach((artifact) => {
    const request = REQUEST_ARTIFACT.exec(artifact);
    if (request !== null) {
      body.requests.push({ pageId: request[1], requestId: request[2] });
      return;
    }
    const page = PAGE_ARTIFACT.exec(artifact);
    if (page !== null) {
      body.pages.push(page[1]);
      return;
    }
    const endpoint = ENDPOINT_ARTIFACT.exec(artifact);
    if (endpoint !== null) {
      body.endpoints.push(endpoint[1]);
      return;
    }
    if (artifact === 'events.json') {
      body.appEvents = true;
      return;
    }
    throw new Error(`The mutation report names an unknown artifact "${artifact}".`);
  });
  return body;
}

// Which of an earlier report's mutants still exist in the current build: the
// dev server lists every operator on the artifacts they were kept on, and its
// `ids` hold every copy's id, so a mutant counts as existing whichever copy
// this listing would keep. Returns the Set of current ids; empty when there
// is nothing to ask about.
async function requestCurrentMutantIds({ url, mutants }) {
  const artifacts = [...new Set(mutants.map(({ artifact }) => artifact))];
  if (artifacts.length === 0) {
    return new Set();
  }
  const listing = await postMutants({ url, body: listingBody({ artifacts }) });
  return new Set(listing.ids);
}

export default requestCurrentMutantIds;
