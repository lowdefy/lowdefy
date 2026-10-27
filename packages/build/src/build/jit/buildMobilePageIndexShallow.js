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

// The dev form of the mobile page index: every page a shell may open, with the
// path it opens at. The dev server builds pages on demand, so there is no page
// hash or type set yet; a shell checks a page's types when its response arrives.
function buildMobilePageIndexShallow({ components, context }) {
  const paths = new Map(context.routes.map((route) => [route.pageId, route.path]));
  context.mobilePageIndex = components.pages
    .filter((page) => page.target === 'mobile' || page.target === 'both')
    .map((page) => ({ path: paths.get(page.pageId), pageId: page.pageId }));
  context.mobileTypeSets = {};
  return components;
}

export default buildMobilePageIndexShallow;
