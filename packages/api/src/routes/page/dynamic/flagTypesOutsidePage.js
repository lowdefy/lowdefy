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

// The production client loads each page's own client types. A fragment may use
// any type the app bundles (buildDynamicBlocks checks app-wide membership), so a
// fragment that reaches outside its page's types asks the client for the full
// set, and the warning names what the Dynamic block should declare.
function flagTypesOutsidePage(context, { pageConfig, pageTypeSets, usedTypes }) {
  // Dev builds write null: the dev client bundles every installed type.
  if (pageTypeSets === null) {
    return;
  }
  const pageTypeSet = pageTypeSets[pageConfig.pageId];
  const outside = [];
  Object.entries(usedTypes).forEach(([category, used]) => {
    const pageTypes = new Set(pageTypeSet[category]);
    used.forEach((typeName) => {
      if (!pageTypes.has(typeName)) {
        outside.push(typeName);
      }
    });
  });
  if (outside.length === 0) {
    return;
  }
  pageConfig.loadAllTypes = true;
  context.logger.warn(
    { event: 'dynamic_types_outside_page', pageId: pageConfig.pageId, types: outside },
    `Dynamic content on page "${
      pageConfig.pageId
    }" uses types not declared in its Dynamic blocks' properties.types: ${outside.join(
      ', '
    )}. The page loads the full client type set.`
  );
}

export default flagTypesOutsidePage;
