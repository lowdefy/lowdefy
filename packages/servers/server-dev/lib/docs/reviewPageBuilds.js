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

import pageBuildRecords from '../server/pageBuildRecords.js';
import readBuildArtifact from './readBuildArtifact.js';
import reviewPage, { createModifiedAt } from './reviewPage.js';

// Sorts the registered pages by what the dev server knows about them (see
// reviewPage): edited, unbuilt, and failed, the pages whose last build failed,
// with its errors. Each distinct file is stat'ed once per call.
function reviewPageBuilds() {
  const registry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const modifiedAt = createModifiedAt();
  const edited = [];
  const unbuilt = [];
  const failed = [];
  for (const [pageId, entry] of Object.entries(registry)) {
    const errors = pageBuildRecords.get(pageId)?.errors;
    if (errors) {
      failed.push({ pageId, errors });
    }
    const review = reviewPage({ pageId, entry, modifiedAt, configDirectory });
    if (review === 'edited') {
      edited.push(pageId);
    } else if (review === 'unbuilt') {
      unbuilt.push(pageId);
    }
  }
  return { edited, unbuilt, failed };
}

export default reviewPageBuilds;
