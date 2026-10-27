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

// The mobile frame with the items this caller may open. A stack frame has no
// items. A mobile menu item carries no auth of its own: it shows when the
// caller may open its page.
function filterMobileMenus({ menus, openablePageIds }) {
  if (menus.stack === true) {
    return menus;
  }
  if (menus.tabs) {
    return { tabs: menus.tabs.filter((item) => openablePageIds.has(item.pageId)) };
  }
  return { drawer: menus.drawer.filter((item) => openablePageIds.has(item.pageId)) };
}

export default filterMobileMenus;
