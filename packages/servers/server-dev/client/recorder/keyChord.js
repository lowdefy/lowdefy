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

const MODIFIER_KEYS = ['Control', 'Meta', 'Alt', 'Shift', 'AltGraph', 'CapsLock'];
const PLAIN_KEYS = ['Enter', 'Escape'];

function keyName(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

// A keydown as a chord in the journey runner's press syntax, or null when it
// is typing (captured as input instead). Enter and Escape are recorded alone;
// any other key only when held with Ctrl, Meta or Alt. The platform modifier
// (Meta on macOS, Ctrl elsewhere) is written Mod, so a chord replays on
// either.
function keyChord(event, { platform }) {
  const { key } = event;
  if (typeof key !== 'string' || key === '' || MODIFIER_KEYS.includes(key)) return null;
  const mac = /mac/i.test(platform ?? '');
  const platformHeld = mac ? event.metaKey : event.ctrlKey;
  const otherHeld = mac ? event.ctrlKey : event.metaKey;
  if (!platformHeld && !otherHeld && !event.altKey) {
    return PLAIN_KEYS.includes(key) ? key : null;
  }
  const parts = [];
  if (platformHeld) parts.push('Mod');
  if (otherHeld) parts.push(mac ? 'Control' : 'Meta');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  parts.push(keyName(key));
  return parts.join('+');
}

export default keyChord;
