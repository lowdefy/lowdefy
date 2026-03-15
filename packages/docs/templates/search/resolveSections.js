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

function resolveSections(pages, menus) {
  const sectionMap = new Map();

  function walkLinks(links, parentGroup) {
    (links ?? []).forEach((link) => {
      if (link.type === 'MenuGroup') {
        const group = {
          label: link.properties?.title ?? link.id,
          icon: link.properties?.icon,
        };
        walkLinks(link.links, group);
      } else if (link.type === 'MenuLink' && link.pageId) {
        if (parentGroup) {
          sectionMap.set(link.pageId, parentGroup);
        }
      }
    });
  }

  (menus ?? []).forEach((menu) => {
    walkLinks(menu.links, null);
  });

  return sectionMap;
}

export default resolveSections;
