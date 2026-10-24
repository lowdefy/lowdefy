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

import { ConfigError } from '@lowdefy/errors';

import {
  checkArray,
  checkKeys,
  checkObject,
  checkOptionalPath,
  checkOptionalString,
  checkString,
  checkUniqueIds,
} from './mobileChecks.js';

const SHORTCUT_KEYS = ['id', 'title', 'subtitle', 'icon', 'path'];
// iOS shows four quick actions on the app icon; Android launchers show four or five.
const MAX_SHORTCUTS = 4;

// mobile.shortcuts: the app icon's long-press actions on iOS and Android, and the options of the
// shell's App Shortcuts and Siri intent on iOS. Each opens its path and fires onShortcut.
function validateMobileShortcuts({ shortcuts, configKey }) {
  const path = 'mobile.shortcuts';
  checkArray({ value: shortcuts, path, configKey });
  if (shortcuts.length > MAX_SHORTCUTS) {
    throw new ConfigError(
      `App "${path}" should have at most ${MAX_SHORTCUTS} shortcuts. Received ${shortcuts.length}.`,
      { configKey }
    );
  }
  shortcuts.forEach((shortcut, index) => {
    const itemPath = `${path}[${index}]`;
    checkObject({ value: shortcut, path: itemPath, configKey });
    const key = shortcut['~k'] ?? configKey;
    checkKeys({ object: shortcut, allowed: SHORTCUT_KEYS, path: itemPath, configKey: key });
    checkString({ value: shortcut.id, path: `${itemPath}.id`, configKey: key });
    checkString({ value: shortcut.title, path: `${itemPath}.title`, configKey: key });
    checkOptionalString({ value: shortcut.subtitle, path: `${itemPath}.subtitle`, configKey: key });
    checkOptionalString({ value: shortcut.icon, path: `${itemPath}.icon`, configKey: key });
    checkOptionalPath({ value: shortcut.path, path: `${itemPath}.path`, configKey: key });
  });
  checkUniqueIds({ items: shortcuts, path, configKey });
}

export default validateMobileShortcuts;
