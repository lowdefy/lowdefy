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

import collectMobilePageIconNames from './collectMobilePageIconNames.js';
import isMobilePage from './isMobilePage.js';
import loadIconData from '../icons/loadIconData.js';

// A shell draws a page's icons from icon data the page carries, as the web
// inlines a page's icons into its page types chunk: each mobile and shared
// page gets _icons, { name: IconData }, for the icons it draws. The full build
// runs it on the final page config (after buildPageTypes) and before
// buildMobilePageIndex, so the page hash covers _icons; the dev skeleton build
// runs it on its inline pages. Web pages are left as they are.
async function buildMobilePageIcons({ components, context }) {
  const mobilePages = components.pages.filter(isMobilePage);
  if (mobilePages.length === 0) {
    return;
  }
  const pageNames = mobilePages.map((page) =>
    collectMobilePageIconNames({
      context,
      global: components.global ?? {},
      icons: context.icons,
      page,
    })
  );
  const iconData = await loadIconData({
    names: [...new Set(pageNames.flat())],
    icons: context.icons,
  });
  mobilePages.forEach((page, index) => {
    page._icons = Object.fromEntries(pageNames[index].map((name) => [name, iconData[name]]));
  });
}

export default buildMobilePageIcons;
