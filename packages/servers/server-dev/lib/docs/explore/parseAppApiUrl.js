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

// The request or endpoint an app API URL calls: /api/request/<pageId>/<requestId>
// or /api/endpoints/<endpointId>, after the base path. Null for any other URL.
function parseAppApiUrl({ url, basePath = '' }) {
  const { pathname } = new URL(url);
  const requestPrefix = `${basePath}/api/request/`;
  const endpointPrefix = `${basePath}/api/endpoints/`;
  if (pathname.startsWith(requestPrefix)) {
    const segments = pathname.slice(requestPrefix.length).split('/');
    return {
      requestId: segments[segments.length - 1],
      pageId: segments.slice(0, -1).join('/'),
      endpointId: null,
    };
  }
  if (pathname.startsWith(endpointPrefix)) {
    return { requestId: null, pageId: null, endpointId: pathname.slice(endpointPrefix.length) };
  }
  return null;
}

export default parseAppApiUrl;
