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

function describeHttpError(error) {
  if (type.isNone(error.response)) {
    return `Could not reach the dev server: ${error.message}`;
  }
  const body = type.isString(error.response.data)
    ? error.response.data
    : JSON.stringify(error.response.data);
  return `GET /lowdefy-docs/snapshot responded ${error.response.status}: ${body}`;
}

async function getJson({ url }) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(describeHttpError(error));
  }
}

// The page list and dev user names the manifest-less run captures. Both come
// from the dev server because only it has the built artefacts and lowdefy.yaml
// with every _ref resolved.
async function fetchAppPageIds({ url }) {
  const appMap = await getJson({ url: `${url}/lowdefy-docs/app-map` });
  return (appMap.pages ?? []).map((page) => page.pageId);
}

async function fetchDevUsers({ url }) {
  const response = await getJson({ url: `${url}/lowdefy-docs/dev-users` });
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
  let response;
  try {
    response = await axios.get(`${url}/lowdefy-docs/snapshot/${target.pageId}`, { params });
  } catch (error) {
    throw new Error(describeHttpError(error));
  }
  const snapshot = response.data ?? {};
  if (!type.isNone(snapshot.error)) {
    throw new Error(snapshot.error);
  }
  return snapshot;
}

export { fetchAppPageIds, fetchDevUsers };
export default fetchSnapshot;
