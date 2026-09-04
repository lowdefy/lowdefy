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
import { serializer } from '@lowdefy/helpers';

// The expansion is already on disk: build/pages/<pageId>.json is the fully
// built page and build/pages/<pageId>/requests/<requestId>.json is one file per
// page request. Both are serializer output, so dates and arrays come back as
// themselves rather than as their markers.
function readBuiltPage({ directory, pageId }) {
  const pagePath = path.join(directory, 'pages', `${pageId}.json`);
  if (!fs.existsSync(pagePath)) {
    throw new Error(
      `No built page "${pageId}" found at ${pagePath}. Run "lowdefy build" first, and check the page id.`
    );
  }
  const page = serializer.deserializeFromString(fs.readFileSync(pagePath, 'utf8'));

  const requestsDirectory = path.join(directory, 'pages', pageId, 'requests');
  if (!fs.existsSync(requestsDirectory)) {
    return { page, requests: [] };
  }
  const requests = fs
    .readdirSync(requestsDirectory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => ({
      requestId: fileName.slice(0, -'.json'.length),
      config: serializer.deserializeFromString(
        fs.readFileSync(path.join(requestsDirectory, fileName), 'utf8')
      ),
    }));
  return { page, requests };
}

export default readBuiltPage;
