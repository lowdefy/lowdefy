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

import fs from 'fs';
import path from 'path';

// Removes the request artifacts of a page that its latest build no longer
// has. The request route runs whatever request artifact is on disk once the
// page is built, and a config publish keeps the artifacts of the pages it
// publishes, so a request taken out of a page must not stay callable.
function removeDroppedRequests({ buildDirectory, pageId, requests }) {
  const directory = path.join(buildDirectory, 'pages', pageId, 'requests');
  const kept = new Set(requests.map((request) => `${request.requestId}.json`));
  let names;
  try {
    names = fs.readdirSync(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const name of names) {
    if (name.endsWith('.json') && !kept.has(name)) {
      fs.rmSync(path.join(directory, name), { force: true });
    }
  }
}

export default removeDroppedRequests;
