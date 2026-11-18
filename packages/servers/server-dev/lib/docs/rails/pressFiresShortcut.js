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

// The modifier names a block's `shortcut` takes (client createShortcutManager's MODIFIER_MAP,
// with tinykeys' own `$mod`) and the ones Playwright's `keyboard.press` takes, as the modifier
// they hold down. `mod` is the platform's: Meta on Apple, Control elsewhere.
const MODIFIERS = {
  mod: 'mod',
  $mod: 'mod',
  controlormeta: 'mod',
  ctrl: 'control',
  control: 'control',
  alt: 'alt',
  shift: 'shift',
  meta: 'meta',
};

// One chord as the set of modifiers it holds and its key, both lower case, `mod` resolved to
// the platform modifier. A chord whose key is `+` ends in an empty part, so the key is `+`.
function parseChord({ chord, modifier }) {
  const parts = chord.split('+');
  const key = parts.at(-1) === '' ? '+' : parts.at(-1);
  const held = parts.slice(0, parts.at(-1) === '' ? -2 : -1).map((part) => {
    const name = MODIFIERS[part.toLowerCase()] ?? part.toLowerCase();
    return name === 'mod' ? modifier.toLowerCase() : name;
  });
  return { modifiers: new Set(held), key: key.toLowerCase() };
}

function sameModifiers(left, right) {
  return left.size === right.size && [...left].every((name) => right.has(name));
}

// Whether pressing `key` (the chord the runner presses, `Mod` already resolved) fires a block
// event with this `shortcut`, the way tinykeys matches it: the same modifiers held, no others,
// and the same key, case ignored. A sequence (`g i`) fires on the press of its last chord, so
// that chord is matched; a press of it with no press of the chords before refuses too much,
// never too little. `modifier` is the platform modifier (getShortcutModifier).
function pressFiresShortcut({ key, shortcut, modifier }) {
  const pressed = parseChord({ chord: key, modifier });
  const last = shortcut.trim().split(/\s+/).at(-1);
  const bound = parseChord({ chord: last, modifier });
  return pressed.key === bound.key && sameModifiers(pressed.modifiers, bound.modifiers);
}

export default pressFiresShortcut;
