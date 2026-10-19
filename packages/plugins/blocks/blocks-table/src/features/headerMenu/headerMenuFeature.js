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

import createAutosizeColumn from './createAutosizeColumn.js';
import createCloseHeaderMenu from './createCloseHeaderMenu.js';
import createOpenHeaderMenu from './createOpenHeaderMenu.js';
import getChromeMenuItems from './getChromeMenuItems.js';
import handleHeaderButtonPointerDown from './handleHeaderButtonPointerDown.js';
import handleHeaderMenuClick from './handleHeaderMenuClick.js';
import handleHeaderMenuKeyDown from './handleHeaderMenuKeyDown.js';
import HeaderMenuTrigger from './HeaderMenuTrigger.js';
import useHeaderMenuState from './useHeaderMenuState.js';

import './headerMenu.css';

// The column header menu (D7, D15): on by default, `headerMenu: false` turns it off. Its items
// come from every feature's `headerMenuItems` (see collectHeaderMenuItems.js); this module
// contributes sort, pin, freeze, autosize and hide.
const headerMenuFeature = {
  name: 'headerMenu',
  headerParts: [HeaderMenuTrigger],
  headerMenuItems: getChromeMenuItems,
  actions: {
    openHeaderMenu: createOpenHeaderMenu,
    closeHeaderMenu: createCloseHeaderMenu,
    autosizeColumn: createAutosizeColumn,
  },
  gridHandlers: {
    click: handleHeaderMenuClick,
    keydown: handleHeaderMenuKeyDown,
    pointerdown: handleHeaderButtonPointerDown,
  },
  useFeature: useHeaderMenuState,
};

export default headerMenuFeature;
