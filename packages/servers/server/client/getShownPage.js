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

// The page a navigation to `path` shows, from the page response. At the app root the client
// fetches the home page's own path, but the shown instance is matched on the root, as on a first
// load there, so a later navigation to the root (a query change, the home link) needs no fetch.
function getShownPage({ path, response }) {
  const { pageConfig, pathParams } = response;
  if (path === '') {
    return { matchedPath: '', pageConfig, pathParams };
  }
  return { matchedPath: response.matchedPath, pageConfig, pathParams };
}

export default getShownPage;
