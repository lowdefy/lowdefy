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

// buildModules has put each module's pages and endpoints in components, and a
// page build resolves a page from its source file (resolvePageSource), so
// nothing reads them from the manifest again. They are most of a manifest:
// left there, the dev server's manager holds every module page and endpoint
// for as long as it runs, and modules.json carries them to every page build
// context that reads it. The rest of the manifest stays: page builds and the
// module docs read its vars, components, menus and exports.
function releaseMergedModuleEntities({ context }) {
  for (const moduleEntry of Object.values(context.modules)) {
    delete moduleEntry.manifest.pages;
    delete moduleEntry.manifest.api;
  }
}

export default releaseMergedModuleEntities;
