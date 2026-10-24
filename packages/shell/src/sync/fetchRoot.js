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

import { parseCallerStamp } from '@lowdefy/helpers';

// GET /api/mobile/root, revalidated with the ETag of the root the shell holds. Returns
// { notModified, root, etag, stamp }: on a 304 the held root is current and root is null. The
// stamp is the caller the server answered as, whichever the status.
async function fetchRoot({ apiBase, etag, fetchWithAuth }) {
  const headers = etag ? { 'If-None-Match': etag } : {};
  const res = await fetchWithAuth(`${apiBase}/api/mobile/root`, { method: 'GET', headers });
  const stamp = parseCallerStamp(res.headers.get('x-lowdefy-caller'));
  if (res.status === 304) {
    return { notModified: true, root: null, etag, stamp };
  }
  if (res.status === 404) {
    throw new Error('This app has no mobile pages.');
  }
  if (!res.ok) {
    throw new Error(`The app's server answered ${res.status} to the mobile root request.`);
  }
  return { notModified: false, root: await res.json(), etag: res.headers.get('etag'), stamp };
}

export default fetchRoot;
