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

// SF Symbol names are lower case words joined by dots (trash, doc.on.doc, checkmark.circle).
const SF_SYMBOL = /^[a-z0-9]+(\.[a-z0-9]+)*$/;

/**
 * The SF Symbol a native menu item shows for a configured icon: `{ sf }`, or an icon name that
 * reads as an SF Symbol. A native menu cannot draw a Lucide icon (PascalCase), so it shows none.
 *
 * @param {string|Object} [icon]
 * @returns {string|undefined}
 */
function getSfSymbol(icon) {
  if (type.isObject(icon)) {
    return type.isString(icon.sf) ? icon.sf : getSfSymbol(icon.name);
  }
  if (type.isString(icon) && SF_SYMBOL.test(icon)) {
    return icon;
  }
  return undefined;
}

export default getSfSymbol;
