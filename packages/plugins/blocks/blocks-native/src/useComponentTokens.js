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

import { useTheme } from '@lowdefy/client-native';

/**
 * The tokens a block draws with: the app's computed antd tokens for the mode showing, with the
 * block's own `theme` property over them, as antd applies a block's component tokens on the web.
 *
 * @param {Object} [componentTheme] The block's `theme` property.
 * @returns {{ isDark: boolean, tokens: Object }}
 */
function useComponentTokens(componentTheme) {
  const { isDark, tokens } = useTheme();
  if (componentTheme === undefined) {
    return { isDark, tokens };
  }
  return { isDark, tokens: { ...tokens, ...componentTheme } };
}

export default useComponentTokens;
