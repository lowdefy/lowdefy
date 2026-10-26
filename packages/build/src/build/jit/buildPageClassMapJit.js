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

import compileMobileClassMap from '../buildMobile/compileMobileClassMap.js';
import getMobileClassCandidates from '../buildMobile/getMobileClassCandidates.js';
import isMobilePage from '../buildMobile/isMobilePage.js';

/**
 * The class map entries of one page built on request: the skeleton build's
 * class map holds only the pages it compiles, so the dev server sends a mobile
 * or shared page with its own classes' entries (`_classMap`), and the shell
 * lays them over the app's. A class with no native form fails the page build,
 * as in the full build. Returns undefined for a web page.
 *
 * Reads the mobile theme and theme.tailwind prepareJitContext restores, and
 * leaves no field on the context.
 */
async function buildPageClassMapJit({ page, context }) {
  if (!isMobilePage(page)) {
    return undefined;
  }
  return compileMobileClassMap({
    candidates: getMobileClassCandidates({ pages: [page] }),
    context,
    mobileTheme: context.mobileTheme,
    tailwindConfig: context.tailwindConfig,
  });
}

export default buildPageClassMapJit;
