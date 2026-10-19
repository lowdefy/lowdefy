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

function decodeSegments(text) {
  return text
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => decodeURIComponent(segment));
}

// Names the dev server route a journey's browser request hit, from its URL
// and method, with the app's basePath honoured. A page request carries its
// request path, which collectExercised matches to a page id through the route
// table. Requests to other origins and to every other route are null.
function matchJourneyRoute({ url, method, origin, basePath = '' }) {
  const parsed = new URL(url);
  if (parsed.origin !== origin) {
    return null;
  }
  const prefix = `${basePath}/api/`;
  if (!parsed.pathname.startsWith(prefix)) {
    return null;
  }
  const rest = parsed.pathname.slice(prefix.length);
  if (rest === 'root' && method === 'GET') {
    return { route: 'root' };
  }
  if (rest.startsWith('page/') && method === 'GET') {
    const path = rest.slice('page/'.length);
    if (path === '') {
      return null;
    }
    return { route: 'page', path };
  }
  if (rest.startsWith('request/') && method === 'POST') {
    const segments = decodeSegments(rest.slice('request/'.length));
    if (segments.length < 2) {
      return null;
    }
    return {
      route: 'request',
      pageId: segments.slice(0, -1).join('/'),
      requestId: segments[segments.length - 1],
    };
  }
  if (rest.startsWith('endpoints/')) {
    const segments = decodeSegments(rest.slice('endpoints/'.length));
    if (segments.length === 0) {
      return null;
    }
    return { route: 'endpoint', endpointId: segments.join('/') };
  }
  return null;
}

export default matchJourneyRoute;
