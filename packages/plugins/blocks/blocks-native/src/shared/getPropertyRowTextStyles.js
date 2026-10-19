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

import getSemanticColors from './getSemanticColors.js';

/**
 * The text styles of an iOS Settings-style property row (PropertyRow): the title in Body in the
 * label colour, and the value (or the placeholder that stands for no value) in Body in the
 * secondary label colour. The rows of Selector, NumberInput, TextInput and DateSelector share
 * them, so a List mixing their rows lines up.
 *
 * @param {Object} params
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ title: Object, value: Object }}
 */
function getPropertyRowTextStyles({ tokens }) {
  const colors = getSemanticColors({ tokens });
  return {
    title: { color: colors.label, fontSize: 17 },
    value: { color: colors.secondaryLabel, fontSize: 17 },
  };
}

export default getPropertyRowTextStyles;
