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

import CopyToClipboard from './CopyToClipboard.js';
import GetLocalStorage from './GetLocalStorage.js';
import RemoveLocalStorage from './RemoveLocalStorage.js';
import ScrollTo from './ScrollTo.js';
import SetFocus from './SetFocus.js';
import SetLocalStorage from './SetLocalStorage.js';

// Native bodies of the actions-core actions whose web bodies reach the DOM, under the same names,
// so pages call them as on the web. They reach the device through the shell's host globals
// (createShellGlobals). SetDarkMode and SetLocale keep their actions-core bodies: they call the
// window members the shell sets (client-native's ThemeProvider and the shell's locale).
const nativeActions = {
  CopyToClipboard,
  GetLocalStorage,
  RemoveLocalStorage,
  ScrollTo,
  SetFocus,
  SetLocalStorage,
};

export default nativeActions;
