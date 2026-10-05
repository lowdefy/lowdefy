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

const APP_API_PREFIXES = ['/api/request/', '/api/endpoints/'];

// Whether a URL is one of the app's request or endpoint API routes on this
// dev server: what a journey or walk step counts as the app doing work, and where a 5xx
// is a failed request.
function isAppApiUrl({ url, origin, basePath = '' }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.origin !== origin) return false;
  return APP_API_PREFIXES.some((prefix) => parsed.pathname.startsWith(`${basePath}${prefix}`));
}

export default isAppApiUrl;
