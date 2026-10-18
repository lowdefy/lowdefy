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

import { lucideSfSymbols, semanticLucideNames } from './sfSymbolNames.js';

/**
 * The SF Symbol iOS draws for an icon: `sfSymbol` when the config names one, else the symbol of
 * the icon's Lucide name or Lowdefy semantic name (`Inbox` is `tray`, the semantic `edit` is
 * `pencil`), else null, and the icon draws as its Lucide icon.
 *
 * @param {Object} params
 * @param {string} [params.icon] An icon name: a Lucide name, `lucide:Name` or a semantic name.
 * @param {string} [params.sfSymbol] An SF Symbol name the config gives directly.
 * @returns {string|null}
 */
function getSfSymbol({ icon, sfSymbol }) {
  if (type.isString(sfSymbol)) {
    return sfSymbol;
  }
  if (!type.isString(icon)) {
    return null;
  }
  const name = icon.replace(/^lucide:/, '');
  const lucideName = semanticLucideNames[name] ?? name;
  return lucideSfSymbols[lucideName] ?? null;
}

export default getSfSymbol;
