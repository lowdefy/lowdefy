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

import collectExceptions from '../../utils/collectExceptions.js';
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
function validateMobileShortcuts({ shortcuts, configKey, context }) {
  const path = 'mobile.shortcuts';
  if (!checkArray({ value: shortcuts, path, configKey, context })) {
    return;
  }
  if (shortcuts.length > MAX_SHORTCUTS) {
    collectExceptions(
      context,
      new ConfigError(
        `App "${path}" should have at most ${MAX_SHORTCUTS} shortcuts. Received ${shortcuts.length}.`,
        { configKey }
      )
    );
  }
  let itemsAreObjects = true;
  shortcuts.forEach((shortcut, index) => {
    const itemPath = `${path}[${index}]`;
    if (!checkObject({ value: shortcut, path: itemPath, configKey, context })) {
      itemsAreObjects = false;
      return;
    }
    const key = shortcut['~k'] ?? configKey;
    checkKeys({
      object: shortcut,
      allowed: SHORTCUT_KEYS,
      path: itemPath,
      configKey: key,
      context,
    });
    checkString({ value: shortcut.id, path: `${itemPath}.id`, configKey: key, context });
    checkString({ value: shortcut.title, path: `${itemPath}.title`, configKey: key, context });
    checkOptionalString({
      value: shortcut.subtitle,
      path: `${itemPath}.subtitle`,
      configKey: key,
      context,
    });
    checkOptionalString({
      value: shortcut.icon,
      path: `${itemPath}.icon`,
      configKey: key,
      context,
    });
    checkOptionalPath({ value: shortcut.path, path: `${itemPath}.path`, configKey: key, context });
  });
  if (itemsAreObjects) {
    checkUniqueIds({ items: shortcuts, path, configKey, context });
  }
}

export default validateMobileShortcuts;
