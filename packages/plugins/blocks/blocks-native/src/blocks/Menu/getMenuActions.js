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

// The checked state of an item that can be checked: a checkmark when on, a plain item that can
// take one when off. An item without `checked` is an action.
function getState(checked) {
  if (checked === true) return 'on';
  if (checked === false) return 'off';
  return undefined;
}

// A native menu cannot draw an avatar, so an item for a person shows the person symbol.
function getImage(item) {
  return item.symbol ?? (item.avatar ? 'person.crop.circle' : undefined);
}

function toAction({ item, path }) {
  if (Array.isArray(item.items)) {
    return {
      id: item.id ?? `section_${path}`,
      title: item.title,
      image: item.symbol,
      displayInline: item.submenu !== true,
      subactions: item.items.map((child, index) =>
        toAction({ item: child, path: `${path}_${index}` })
      ),
    };
  }
  return {
    id: item.id,
    title: item.title,
    image: getImage(item),
    state: getState(item.checked),
    attributes: {
      destructive: item.destructive === true,
      disabled: item.disabled === true,
      hidden: item.hidden === true,
    },
  };
}

/**
 * The actions of a native menu (@expo/ui's community MenuView) for a Menu block's items. An item
 * with `items` is a section of the menu, drawn inline under its title, or a nested menu with
 * `submenu: true`.
 *
 * @param {Object} params
 * @param {Object[]} params.items `{ id, title, symbol, checked, destructive, disabled, hidden }`
 *   or `{ id, title, symbol, submenu, items }`.
 * @returns {Object[]} MenuView actions.
 */
function getMenuActions({ items }) {
  return items.map((item, index) => toAction({ item, path: `${index}` }));
}

export default getMenuActions;
