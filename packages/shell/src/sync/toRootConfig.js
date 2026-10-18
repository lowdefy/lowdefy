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

// The root config @lowdefy/client-native renders pages with, from the mobile root. The web menus
// (_menu) have no mobile counterpart; the mobile frame is the shell's.
function toRootConfig(root) {
  return {
    events: root.events,
    home: { configured: true, pageId: root.homePageId },
    lowdefyApp: root.lowdefyApp ?? {},
    lowdefyGlobal: root.lowdefyGlobal ?? {},
    menus: [],
    pagePaths: Object.fromEntries(root.pageIndex.map((entry) => [entry.pageId, entry.path])),
    theme: root.theme ?? {},
  };
}

export default toRootConfig;
