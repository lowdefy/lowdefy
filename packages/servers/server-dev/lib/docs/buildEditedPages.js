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

import buildPageIfNeeded from '../server/jitPageBuilder.js';
import reviewPageBuilds from './reviewPageBuilds.js';

// Builds every page an edit touched (see reviewPageBuilds), the same build a
// page request runs, so build status covers pages nobody has opened since the
// edit. A failed build is recorded by the page builder and reported from there.
async function buildEditedPages() {
  const { edited } = reviewPageBuilds();
  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  for (const pageId of edited) {
    try {
      await buildPageIfNeeded({ pageId, buildDirectory, configDirectory });
    } catch {
      // Reported by getPageBuildStatus from the page's build record.
    }
  }
  return edited;
}

export default buildEditedPages;
