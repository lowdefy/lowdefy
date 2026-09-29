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

import assignOptionColors from './assignOptionColors.js';

// A user-defined column's normalised options with a tone for each option without a colour: the
// tone the add-column picker would give it (assignOptionColors: the first tone no other option
// uses, in option order), so a column saved through the API with plain string options, or before
// options had colours, renders like one the picker made. Options with a colour keep it.
function fillOptionColors(options) {
  if (type.isNone(options)) return options;
  if (options.every((option) => !type.isNone(option.color))) return options;
  const colors = assignOptionColors({
    values: options.map((option) => option.value),
    previous: options,
  });
  return options.map((option, index) =>
    type.isNone(option.color) ? { ...option, color: colors[index].color } : option
  );
}

export default fillOptionColors;
