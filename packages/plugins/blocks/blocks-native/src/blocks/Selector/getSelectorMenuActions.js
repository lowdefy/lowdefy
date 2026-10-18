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

import getOptionLabel from './getOptionLabel.js';

// The menu item that stands for no value.
const NO_VALUE_ID = 'no_value';

function getOptionImage(option) {
  if (!type.isObject(option)) return undefined;
  return option.symbol ?? (option.avatar ? 'person.crop.circle' : undefined);
}

/**
 * The native menu actions of a Selector with `variant: menu`: one checkable item per option,
 * the chosen one checked, each with its SF Symbol (or the person symbol for an option with
 * an avatar). A disabled option is shown dimmed. The placeholder item, checked while nothing is
 * chosen, comes first while there is no value or the value can be cleared. An action's id is
 * its option's index, as the menu passes ids back as strings.
 *
 * @param {Object} params
 * @param {boolean} params.allowClear
 * @param {Array} params.options
 * @param {string} params.placeholder
 * @param {number|null} params.selectedIndex
 * @returns {Object[]}
 */
function getSelectorMenuActions({ allowClear, options, placeholder, selectedIndex }) {
  const actions = options.map((option, index) => ({
    id: `${index}`,
    title: getOptionLabel({ option }),
    image: getOptionImage(option),
    state: index === selectedIndex ? 'on' : 'off',
    attributes: { disabled: type.isObject(option) && option.disabled === true },
  }));
  if (selectedIndex !== null && !allowClear) {
    return actions;
  }
  return [
    {
      id: NO_VALUE_ID,
      title: placeholder,
      state: selectedIndex === null ? 'on' : 'off',
    },
    ...actions,
  ];
}

export { NO_VALUE_ID };
export default getSelectorMenuActions;
