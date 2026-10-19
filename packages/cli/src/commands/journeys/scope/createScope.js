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

import describePageRoles from './describePageRoles.js';

// The scope `lowdefy journeys scope` prints: the revisions compared, each
// page in scope with why and who can open it, the app-wide artifacts and
// uncompared files that changed, the plugin differences and the removed
// pages.
function createScope({ revisions, targets, plugins, headBuild, users }) {
  return {
    base: revisions.base,
    head: revisions.head,
    dirty: revisions.dirty,
    pages: targets.pages.map((page) => ({
      ...page,
      roles: describePageRoles({ page: headBuild.pages[page.pageId], users }),
    })),
    appWide: targets.appWide,
    uncompared: targets.uncompared,
    plugins,
    removedPages: targets.removedPages,
  };
}

export default createScope;
