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

// Action `openHeaderMenu({ key, toggle })`. With `toggle` (the menu button) a second press closes
// the menu: either it is still open (keyboard), or the press itself already dismissed it.
function createOpenHeaderMenu(api) {
  return function openHeaderMenu({ key, toggle }) {
    if (!api.config.headerMenu) return false;
    const { openKey, pressedOpen } = api.headerMenu;
    api.headerMenu.pressedOpen = null;
    if (toggle && (openKey === key || pressedOpen === key)) {
      api.actions.closeHeaderMenu();
      return true;
    }
    api.headerMenu.setOpenKey(key);
    return true;
  };
}

export default createOpenHeaderMenu;
