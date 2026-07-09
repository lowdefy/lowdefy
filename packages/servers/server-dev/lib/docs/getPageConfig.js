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
import mapPageBuildErrors from './mapPageBuildErrors.js';
import readBuildArtifact from './readBuildArtifact.js';
import readPageArtifact from './readPageArtifact.js';

// JIT-builds a page (same pipeline as GET /api/page/*, see src/routes/jitPage.js)
// and returns its built config so agents can inspect a page's blocks/requests
// without a browser. Returns null when the pageId isn't registered at all.
async function getPageConfig({ pageId }) {
  const registry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  if (!registry[pageId]) {
    return null;
  }

  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();

  let buildResult;
  try {
    buildResult = await buildPageIfNeeded({ pageId, buildDirectory, configDirectory });
  } catch (error) {
    return { buildError: true, errors: mapPageBuildErrors(error) };
  }

  if (buildResult === false) {
    return null;
  }
  if (buildResult && buildResult.installing) {
    return { installing: true, packages: buildResult.packages };
  }

  return readPageArtifact({ pageId }) ?? {};
}

export default getPageConfig;
