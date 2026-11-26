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

import { buildPageWithContext, getPageJitEnrichment } from '../server/jitPageBuilder.js';

// The page builds a headless journey on this thread asks for (runJourneyHeadless,
// createDevServerHost), on the dev server's one JIT build context. build({ pageId }) builds the
// page when its last build is not current and answers { result, built }: result is
// buildPageWithContext's (false for a page not in the registry, true for one already current, or
// the build's outcome), and `built` is the build context it ran on. jsEntries({ pageConfig, built })
// answers the client module text of the page's _js, read from that context (getPageJitEnrichment).
// A journey worker thread asks the main thread for both instead (createWorkerPageBuilds), since
// the page builds must have one writer.
function createLocalPageBuilds() {
  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd();
  return {
    async build({ pageId }) {
      const { result, buildContext } = await buildPageWithContext({
        pageId,
        buildDirectory,
        configDirectory,
      });
      return { result, built: buildContext };
    },
    async jsEntries({ pageConfig, built }) {
      return getPageJitEnrichment({ pageConfig, buildContext: built }).jsEntries;
    },
  };
}

export default createLocalPageBuilds;
