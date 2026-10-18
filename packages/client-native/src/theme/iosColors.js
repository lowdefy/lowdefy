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

// UIKit's semantic colours for each mode, as tokens. antd has no tokens for the grouped surfaces,
// the separator or the label tiers a phone screen is drawn with, so the theme adds these.
//
// - colorGroupedBackground: systemGroupedBackground, the screen behind grouped sections.
// - colorCell: secondarySystemGroupedBackground, a cell, card or section on that screen.
// - colorCellNested: tertiarySystemGroupedBackground, a field or box inside a cell.
// - colorCellPressed: systemGray4, a pressed cell.
// - colorSystemBackground: systemBackground, a plain (ungrouped) screen.
// - colorSeparator, colorOpaqueSeparator: the hairline between cells.
// - colorLabel, colorSecondaryLabel, colorTertiaryLabel, colorQuaternaryLabel: text tiers.
// - colorSystemFill to colorQuaternarySystemFill: fills for controls, from thin shapes (a
//   switch track) to large areas (a search field).
const iosColors = {
  light: {
    colorGroupedBackground: '#F2F2F7',
    colorCell: '#FFFFFF',
    colorCellNested: '#F2F2F7',
    colorCellPressed: '#D1D1D6',
    colorSystemBackground: '#FFFFFF',
    colorSeparator: 'rgba(60,60,67,0.29)',
    colorOpaqueSeparator: '#C6C6C8',
    colorLabel: '#000000',
    colorSecondaryLabel: 'rgba(60,60,67,0.6)',
    colorTertiaryLabel: 'rgba(60,60,67,0.3)',
    colorQuaternaryLabel: 'rgba(60,60,67,0.18)',
    colorSystemFill: 'rgba(120,120,128,0.2)',
    colorSecondarySystemFill: 'rgba(120,120,128,0.16)',
    colorTertiarySystemFill: 'rgba(118,118,128,0.12)',
    colorQuaternarySystemFill: 'rgba(116,116,128,0.08)',
  },
  dark: {
    colorGroupedBackground: '#000000',
    colorCell: '#1C1C1E',
    colorCellNested: '#2C2C2E',
    colorCellPressed: '#3A3A3C',
    colorSystemBackground: '#000000',
    colorSeparator: 'rgba(84,84,88,0.6)',
    colorOpaqueSeparator: '#38383A',
    colorLabel: '#FFFFFF',
    colorSecondaryLabel: 'rgba(235,235,245,0.6)',
    colorTertiaryLabel: 'rgba(235,235,245,0.3)',
    colorQuaternaryLabel: 'rgba(235,235,245,0.16)',
    colorSystemFill: 'rgba(120,120,128,0.36)',
    colorSecondarySystemFill: 'rgba(120,120,128,0.32)',
    colorTertiarySystemFill: 'rgba(118,118,128,0.24)',
    colorQuaternarySystemFill: 'rgba(118,118,128,0.18)',
  },
};

export default iosColors;
