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

import { getFromArray } from '@lowdefy/operators';

function _menu({ params, menus, location }) {
  const result = getFromArray({ params, array: menus, key: 'menuId', operator: '_menu', location });
  // When selecting a single menu, return its links array directly.
  // _menu: true and { all: true } return the full menus array (result is an array).
  if (result && !Array.isArray(result)) {
    return result.links ?? [];
  }
  return result;
}

_menu.dynamic = true;

export default _menu;
