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

import pressFiresShortcut from './pressFiresShortcut.js';

// The ids of the shown blocks with an event `shortcut` a press of `key` fires, as the client's
// createShortcutManager binds them: each event's shortcut, one or a list, on every block whose own
// `visible` is not false.
function findShortcutBlocks({ actor, key }) {
  return Object.entries(actor.page.context._internal.RootSlots.map)
    .filter(([, block]) => block.visibleEval?.output !== false)
    .filter(([, block]) =>
      Object.values(block.Events?.events ?? {}).some((event) => {
        if (!event?.shortcut) return false;
        const bound = Array.isArray(event.shortcut) ? event.shortcut : [event.shortcut];
        // A headless press holds no modifier, so `$mod` never matches; any platform's will do.
        return bound.some((shortcut) =>
          pressFiresShortcut({ key, shortcut: String(shortcut), modifier: 'Control' })
        );
      })
    )
    .map(([blockId]) => blockId);
}

export default findShortcutBlocks;
