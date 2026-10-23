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

import isMac from '../isMac.js';
import parseShortcut from '../parseShortcut.js';

// A shortcut as people read it: `mod+shift+k` is ⇧⌘K on a Mac and Ctrl+Shift+K elsewhere.
function getShortcutLabel(shortcut, mac = isMac) {
  const parsed = parseShortcut(shortcut);
  if (!parsed) return null;
  const key = parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key;
  if (mac) {
    return [parsed.ctrl && '⌃', parsed.alt && '⌥', parsed.shift && '⇧', parsed.mod && '⌘', key]
      .filter(Boolean)
      .join('');
  }
  return [(parsed.mod || parsed.ctrl) && 'Ctrl', parsed.alt && 'Alt', parsed.shift && 'Shift', key]
    .filter(Boolean)
    .join('+');
}

export default getShortcutLabel;
