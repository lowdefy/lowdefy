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

import encodePagePath from './encodePagePath.js';

// GET /api/page/<path> for a page the shell keeps, revalidated with the ETag of the copy it holds.
// Returns { notModified } on a 304, the page { buildId, etag, pageConfig } on a 200, and
// { surface } when the page is for another surface (a web page: the shell opens it in the
// browser). Any other answer throws.
async function fetchPage({ apiBase, etag, fetchWithAuth, path }) {
  const headers = etag ? { 'If-None-Match': etag } : {};
  const res = await fetchWithAuth(`${apiBase}/api/page/${encodePagePath(path)}`, {
    method: 'GET',
    headers,
  });
  if (res.status === 304) {
    return { notModified: true };
  }
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    return { notFound: true, surface: body?.surface ?? null };
  }
  if (!res.ok) {
    throw new Error(`The app's server answered ${res.status} to the page request for "${path}".`);
  }
  const body = await res.json();
  return {
    page: {
      buildId: body.buildId ?? body.pageConfig?._buildId ?? null,
      etag: res.headers.get('etag'),
      pageConfig: body.pageConfig,
    },
  };
}

export default fetchPage;
