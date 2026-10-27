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

import collectMobilePageIconNames from '../buildMobile/collectMobilePageIconNames.js';
import getJitIconContext from './getJitIconContext.js';
import isMobilePage from '../buildMobile/isMobilePage.js';
import loadIconData from '../icons/loadIconData.js';

/**
 * The icon data of one page built on request: a mobile or shared page carries
 * `_icons`, { name: IconData } for the icons it draws, as in the full build
 * (buildMobilePageIcons), and the shell adds them to the icon map its Icon
 * renderer reads. Returns undefined for a web page, whose icons the dev client
 * bundle and _dynamicIcons deliver.
 *
 * Runs after buildPage and _js extraction, and reads the app's global
 * prepareJitContext restores.
 */
async function buildPageIconsJit({ page, context }) {
  if (!isMobilePage(page)) {
    return undefined;
  }
  const icons = await getJitIconContext({ context });
  const names = collectMobilePageIconNames({ context, global: context.global, icons, page });
  return loadIconData({ names, icons });
}

export default buildPageIconsJit;
