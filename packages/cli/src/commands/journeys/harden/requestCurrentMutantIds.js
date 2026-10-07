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

// The page an artifact path belongs to, or null for an endpoint or the app
// events.
function artifactPageId(artifact) {
  const request = REQUEST_ARTIFACT.exec(artifact);
  if (request !== null) {
    return request[1];
  }
  const page = PAGE_ARTIFACT.exec(artifact);
  if (page !== null) {
    return page[1];
  }
  return null;
}

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

// The artifacts in one listing each: every page's with its requests, then the
// endpoints and app events together. The dev server answers 422 for a whole
// listing when one of its pages fails to build, so each page is asked after
// on its own.
function groupArtifacts({ artifacts }) {
  const groups = new Map();
  artifacts.forEach((artifact) => {
    const pageId = artifactPageId(artifact);
    if (!groups.has(pageId)) {
      groups.set(pageId, []);
    }
    groups.get(pageId).push(artifact);
  });
  return [...groups.entries()].map(([pageId, group]) => ({ pageId, artifacts: group }));
}

async function listGroup({ url, pageId, artifacts }) {
  try {
    const listing = await postMutants({ url, body: listingBody({ artifacts }) });
    return { ids: listing.ids, unbuildable: false };
  } catch (error) {
    if (pageId !== null && error.cause?.response?.status === 422) {
      return { ids: [], unbuildable: true };
    }
    throw error;
  }
}

// Which of an earlier report's mutants still exist in the current build: the
// dev server lists every operator on the artifacts they were kept on, and its
// `ids` hold every copy's id, so a mutant counts as existing whichever copy
// this listing would keep. A page that fails to build now cannot say, so its
// earlier mutants count as existing and the page is named in
// `unbuildablePages`. Returns { ids, unbuildablePages }, ids a Set.
async function requestCurrentMutantIds({ url, mutants }) {
  const artifacts = [...new Set(mutants.map(({ artifact }) => artifact))];
  const ids = new Set();
  const unbuildablePages = [];
  for (const group of groupArtifacts({ artifacts })) {
    const listed = await listGroup({ url, ...group });
    listed.ids.forEach((id) => ids.add(id));
    if (listed.unbuildable) {
      unbuildablePages.push(group.pageId);
      mutants
        .filter(({ artifact }) => group.artifacts.includes(artifact))
        .forEach(({ id }) => ids.add(id));
    }
  }
  return { ids, unbuildablePages };
}

export default requestCurrentMutantIds;
