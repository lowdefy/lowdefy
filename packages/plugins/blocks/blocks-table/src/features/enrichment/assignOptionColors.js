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

import { type } from '@lowdefy/helpers';

import OPTION_TONES from './optionTones.js';

function readValue(option) {
  return type.isObject(option) ? option.value : option;
}

// An AI tag answer's options with their colours, `[{ value, color }]`, for `values` (the option
// texts, in order): an option keeps the colour it had in `previous` (options, or plain strings
// from a column saved before options had colours), and one without gets the first tone no other
// option uses (OPTION_TONES), so each option starts with a distinct colour.
function assignOptionColors({ values, previous = [] }) {
  const colors = new Map(
    previous
      .filter((option) => type.isObject(option) && type.isString(option.color))
      .map((option) => [option.value, option.color])
  );
  const kept = values.map((value) => colors.get(readValue(value)));
  const used = new Set(kept.filter((color) => color !== undefined));
  return values.map((value, index) => {
    let color = kept[index];
    if (color === undefined) {
      color =
        OPTION_TONES.find((tone) => !used.has(tone)) ?? OPTION_TONES[index % OPTION_TONES.length];
      used.add(color);
    }
    return { value: readValue(value), color };
  });
}

export default assignOptionColors;
