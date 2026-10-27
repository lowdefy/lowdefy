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

// The page a shell opens first: mobile.homePageId, else the first menu item,
// else the first mobile page.
function getMobileHomePageId({ components, mobilePageIndex }) {
  const { mobile } = components;
  const firstMenuItem = mobile.menus?.tabs?.[0] ?? mobile.menus?.drawer?.[0];
  return mobile.homePageId ?? firstMenuItem?.pageId ?? mobilePageIndex[0]?.pageId ?? null;
}

export default getMobileHomePageId;
