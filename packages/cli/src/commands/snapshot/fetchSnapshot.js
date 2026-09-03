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
import { type } from '@lowdefy/helpers';

function describeHttpError(error, { route }) {
  if (type.isNone(error.response)) {
    return `Could not reach the dev server: ${error.message}`;
  }
  const body = type.isString(error.response.data)
    ? error.response.data
    : JSON.stringify(error.response.data);
  return `GET ${route} responded ${error.response.status}: ${body}`;
}

// The metadata routes answer from built artefacts, so a short timeout is
// enough; a hung dev server should fail the run, not wedge it.
async function getJson({ url, route }) {
  try {
    const response = await axios.get(`${url}${route}`, { timeout: 30000 });
    return response.data;
  } catch (error) {
    throw new Error(describeHttpError(error, { route }));
  }
}

// The page list and dev user names the manifest-less run captures. Both come
// from the dev server because only it has the built artefacts and lowdefy.yaml
// with every _ref resolved.
async function fetchAppPageIds({ url }) {
  const appMap = await getJson({ url, route: '/lowdefy-docs/app-map' });
  return (appMap.pages ?? []).map((page) => page.pageId);
}

async function fetchDevUsers({ url }) {
  const response = await getJson({ url, route: '/lowdefy-docs/dev-users' });
  return response.users ?? [];
}

// fetchSnapshot asks the dev server for one page × user snapshot. The route
// takes its object params JSON-encoded because they travel as query strings.
async function fetchSnapshot({ url, target }) {
  const params = {};
  if (!type.isNone(target.requestUser)) {
    params.user = target.requestUser;
  }
  if (!type.isNone(target.urlQuery)) {
    params.urlQuery = JSON.stringify(target.urlQuery);
  }
  if (!type.isNone(target.journey)) {
    params.journey = JSON.stringify(target.journey);
  }
  const route = `/lowdefy-docs/snapshot/${target.pageId}`;
  let response;
  try {
    // Generous bound: the route renders the page in a headless browser and may
    // replay a journey, but a wedged render must not hang the CLI forever.
    response = await axios.get(`${url}${route}`, { params, timeout: 120000 });
  } catch (error) {
    throw new Error(describeHttpError(error, { route }));
  }
  const snapshot = response.data ?? {};
  if (!type.isNone(snapshot.error)) {
    throw new Error(snapshot.error);
  }
  return snapshot;
}

export { fetchAppPageIds, fetchDevUsers };
export default fetchSnapshot;
