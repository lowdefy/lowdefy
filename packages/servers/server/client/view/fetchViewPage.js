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

// A refusal's body is the app's JSON; anything else carries no surface.
async function readSurface(response) {
  try {
    const body = await response.json();
    return body?.surface;
  } catch (error) {
    return undefined;
  }
}

// Fetches the page a view shows at a path, signed in with the view's session.
// The app serves a view session its view pages only, so any refusal is
// answered as { shown: false } with the status, for the caller to act on, and
// whatever the refusal carries is never shown as a page. surface is set when
// the path names a page of the app that is not a view page.
async function fetchViewPage({ fetchPath, host, search }) {
  const response = await host.view.fetchApi(`/api/page/${fetchPath}${search}`);
  if (!response.ok) {
    return { shown: false, status: response.status, surface: await readSurface(response) };
  }
  return {
    shown: true,
    response: await response.json(),
    serverCaller: response.headers.get('x-lowdefy-caller'),
  };
}

export default fetchViewPage;
