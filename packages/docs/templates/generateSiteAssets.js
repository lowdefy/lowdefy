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

import generateSitemap from './generateSitemap.js';
import buildSearchIndex from './buildSearchIndex.js';
import checkOrphans from './checkOrphans.js';
import walkMenus from './walkMenus.js';

/*
  Full-build site assets, run as the `_ref` transformer on pages.yaml:
  sitemap, search index (with per-hit section trails), and the orphan check.

  Per-page navigation state (sidebar menuId, breadcrumb, prev/next, active
  tab) is NOT written here — the dev server's JIT build resolves pages
  individually and would never see it. That lives in general.yaml.njk via
  menus.yaml refs transformed by templates/navFromMenus.js.
*/
function transformer(pages, vars) {
  const { records, membershipCounts } = walkMenus(vars.menus);

  checkOrphans({ pages, membershipCounts });
  generateSitemap(pages);
  buildSearchIndex(pages, records);
  return pages;
}

export default transformer;
