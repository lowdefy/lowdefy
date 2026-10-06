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

// The path of every page with one that this caller may open, as
// { [pageId]: path }, filtered as menus are. The client builds every other
// page's URL from its id.
async function getPagePaths(context) {
  const routes = await context.readConfigFile('routes.json');
  const pagePaths = {};
  routes.forEach((route) => {
    if (route.path === route.pageId) {
      return;
    }
    if (context.authorizeOutcome(route) === 'deny') {
      return;
    }
    pagePaths[route.pageId] = route.path;
  });
  return pagePaths;
}

export default getPagePaths;
