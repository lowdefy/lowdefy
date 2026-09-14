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

import buildPageIfNeeded from './jitPageBuilder.js';

const PAGE_ARTIFACT = /^pages\/(.+)\.json$/;

// Dev builds a page only when its page route is hit, so a headless reader —
// RenderReport via app.getPageConfig, a scheduled routine — finds no
// pages/<id>.json for a page the browser has not opened and treats it as
// unknown. Wrap the context's reader so a miss on a page artifact runs the same
// idempotent JIT build the page route runs, then reads again. An unknown page
// still reads null (buildPageIfNeeded declines ids outside the registry), so
// the null-for-unknown-or-unauthorized contract downstream is unchanged.
function createJitReadConfigFile({ readConfigFile, buildDirectory, configDirectory }) {
  return async function jitReadConfigFile(filePath) {
    const content = await readConfigFile(filePath);
    if (content !== null) return content;
    const match = PAGE_ARTIFACT.exec(filePath);
    // Per-request artifacts (pages/<id>/requests/<rid>.json) belong to a page
    // the request route has already built.
    if (match === null || match[1].includes('/requests/')) return content;
    const built = await buildPageIfNeeded({ pageId: match[1], buildDirectory, configDirectory });
    if (!built || built.installing) return content;
    return readConfigFile(filePath);
  };
}

export default createJitReadConfigFile;
