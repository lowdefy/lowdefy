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

// Agent doc paths (`<section>/<pageId>`) are public (docs.lowdefy.com/md/,
// llms.txt) and used as MCP lookup keys, so they must not move when the
// sidebar is regrouped. The section comes from a fixed `properties.docsSection`
// in menus.yaml, never from group titles: the page's own link first, then the
// nearest group above it that sets one, then its menu.
function resolvePageSections({ menus }) {
  const sectionMap = new Map();
  function walkLinks(links, inheritedSection) {
    (links ?? []).forEach((link) => {
      const section = link.properties?.docsSection ?? inheritedSection;
      if (link.type === 'MenuGroup') {
        walkLinks(link.links, section);
        return;
      }
      if (link.type === 'MenuLink' && link.pageId && section) {
        sectionMap.set(link.pageId, section);
      }
    });
  }
  (menus ?? []).forEach((menu) => {
    walkLinks(menu.links, menu.properties?.docsSection);
  });
  return sectionMap;
}

export default resolvePageSections;
