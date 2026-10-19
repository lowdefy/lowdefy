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

import chunkRecords from './chunkRecords.js';

// One same-origin POST per chunk. keepalive lets a send started on pagehide
// finish after the tab is gone, as a beacon would, with one code path. A
// failed send is dropped: recording must never get in the developer's way.
async function sendRecords({ basePath, records, fetch }) {
  const chunks = chunkRecords({ records });
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        await fetch(`${basePath}/api/dev-recording`, {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });
      } catch {
        // Dropped silently.
      }
    })
  );
}

export default sendRecords;
