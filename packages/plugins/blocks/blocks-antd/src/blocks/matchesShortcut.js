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
import isMacPlatform from './isMac.js';

// `parsed` comes from parseShortcut. `mod` is Cmd on a Mac and Ctrl elsewhere.
function matchesShortcut(e, parsed, isMac = isMacPlatform) {
  if (!parsed || !e.key) return false;
  const modPressed = !parsed.mod || (isMac ? e.metaKey : e.ctrlKey);
  const ctrlPressed = parsed.ctrl ? e.ctrlKey : true;
  const shiftPressed = parsed.shift ? e.shiftKey : !e.shiftKey;
  const altPressed = parsed.alt ? e.altKey : !e.altKey;
  return (
    modPressed && ctrlPressed && shiftPressed && altPressed && e.key.toLowerCase() === parsed.key
  );
}

export default matchesShortcut;
