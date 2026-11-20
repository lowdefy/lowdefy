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

// The items of a DropdownMenu's or Menu's links as blocks-antd's buildMenuItems draws them: every
// MenuLink (a link with no type is one) at any depth, keyed by getKey, with its index among its
// siblings. A MenuDivider is no item; a MenuGroup's links sit in a submenu (inSubmenu), which
// antd opens by hover or click before its items show.
function listMenuLinks({ links, getKey, inSubmenu = false }) {
  return (links ?? []).flatMap((link, index) => {
    if (link.type === 'MenuDivider') {
      return [];
    }
    if (link.type === 'MenuGroup') {
      return listMenuLinks({ links: link.links, getKey, inSubmenu: true });
    }
    return [{ key: String(getKey(link)), link, index, inSubmenu }];
  });
}

export default listMenuLinks;
