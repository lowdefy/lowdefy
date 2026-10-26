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

import { useContext } from 'react';

import ThemeContext from './ThemeContext.js';

/**
 * The theme a native block styles itself with: `{ isDark, preference, tokens }`, `tokens` being
 * antd's computed tokens for the mode showing (colorPrimary, borderRadius, fontSize, ...) with the
 * iOS semantic colours (colorGroupedBackground, colorCell, colorSeparator, colorLabel,
 * colorSecondaryLabel, colorTint, ...; see getSemanticTokens). A block lays these under its
 * `styles` slots: block defaults, then theme, then class, then style.
 */
function useTheme() {
  return useContext(ThemeContext);
}

export default useTheme;
