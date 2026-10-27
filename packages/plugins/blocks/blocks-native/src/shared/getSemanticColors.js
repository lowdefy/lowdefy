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

// Each iOS semantic colour: the theme's iOS token (client-native's getSemanticTokens), then the
// antd token that stands in for it in a theme without the iOS tokens. The first the theme holds
// wins.
const SEMANTIC_TOKENS = {
  // systemGroupedBackground: light #F2F2F7, dark #000.
  groupedBackground: { names: ['colorGroupedBackground', 'colorBgLayout'] },
  // systemBackground: light #FFF, dark #000. A plain list's rows.
  background: { names: ['colorSystemBackground', 'colorBgBase'] },
  // secondarySystemGroupedBackground: light #FFF, dark #1C1C1E.
  cell: { names: ['colorCell', 'colorBgContainer'] },
  // systemGray4 (light #D1D1D6, dark #3A3A3C): the highlight of a pressed cell.
  cellPressed: { names: ['colorCellPressed', 'colorFill'] },
  separator: { names: ['colorSeparator', 'colorBorder'] },
  label: { names: ['colorLabel', 'colorText'] },
  secondaryLabel: { names: ['colorSecondaryLabel', 'colorTextSecondary'] },
  tertiaryLabel: { names: ['colorTertiaryLabel', 'colorTextTertiary'] },
};

function pickToken({ names, tokens }) {
  const name = names.find((tokenName) => type.isString(tokens[tokenName]));
  return tokens[name];
}

/**
 * The iOS semantic colours a list draws with, read from the theme. A theme with the iOS tokens
 * (grouped background, cell, separator and the label tiers) gives them; any other theme falls
 * back to the antd tokens closest to each, so a list looks deliberate in light and dark mode
 * either way.
 *
 * @param {Object} params
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ background: string, groupedBackground: string, cell: string, cellPressed: string, separator: string,
 *   label: string, secondaryLabel: string, tertiaryLabel: string }}
 */
function getSemanticColors({ tokens }) {
  return Object.fromEntries(
    Object.entries(SEMANTIC_TOKENS).map(([key, { names }]) => [key, pickToken({ names, tokens })])
  );
}

export default getSemanticColors;
