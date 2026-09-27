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

// The production client loads each page's own icons. Dynamic content can name
// any icon the app bundles (iconImports), so when the resolved page names one
// its page set lacks, the client loads the app-wide icons before the first
// render instead of drawing a placeholder until they arrive. The scan is the
// build's own discovery scan; the static part of the page adds nothing, since
// its icons are in the page set already. Unlike types, icons outside the page
// are expected here - content is only known at runtime - so there is no warning.
function flagIconsOutsidePage({ collectIconNames, iconImports, pageConfig, pageTypeSets }) {
  // Dev builds write null: the dev client bundles every icon the app names.
  if (pageTypeSets === null) {
    return;
  }
  const pageIcons = new Set(pageTypeSets[pageConfig.pageId].icons);
  const appIcons = new Set(iconImports);
  const names = collectIconNames({ text: JSON.stringify(pageConfig) });
  for (const name of names) {
    if (appIcons.has(name) && !pageIcons.has(name)) {
      pageConfig.loadAllIcons = true;
      return;
    }
  }
}

export default flagIconsOutsidePage;
