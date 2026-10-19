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

import path from 'node:path';

import pageBuildRecords from '../server/pageBuildRecords.js';
import { syncBuildSignals } from '../server/jitPageBuilder.js';
import reviewPage from './reviewPage.js';

// Sorts the registered pages by what the dev server knows about them (see
// reviewPage): edited, unbuilt, and failed, the pages whose last build failed,
// with its errors. The build signals are read first, so an edit no page
// request has seen yet is reviewed too; pages that share a file read it once,
// through the build context's read cache.
async function reviewPageBuilds() {
  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const signals = syncBuildSignals({ buildDirectory, configDirectory });
  const registry = signals.registry ?? {};
  const pageIds = Object.keys(registry);
  const reviews = await Promise.all(
    pageIds.map((pageId) =>
      reviewPage({ pageId, entry: registry[pageId], configDirectory, signals })
    )
  );
  const edited = [];
  const unbuilt = [];
  const failed = [];
  pageIds.forEach((pageId, index) => {
    const errors = pageBuildRecords.get(pageId)?.errors;
    if (errors) {
      failed.push({ pageId, errors });
    }
    if (reviews[index] === 'edited') {
      edited.push(pageId);
    } else if (reviews[index] === 'unbuilt') {
      unbuilt.push(pageId);
    }
  });
  return { edited, unbuilt, failed };
}

export default reviewPageBuilds;
