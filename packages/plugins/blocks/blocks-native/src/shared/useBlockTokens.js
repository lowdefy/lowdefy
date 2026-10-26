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
import { useTheme } from '@lowdefy/client-native';

/**
 * The theme a block draws with: the computed antd tokens of the mode showing, with the block's
 * own `theme` overrides over them, as a web block's `theme` property overrides antd's tokens.
 * An override applies wherever the native block reads a token of the same name.
 *
 * @param {Object} params
 * @param {Object} params.properties The block's properties.
 * @returns {{ isDark: boolean, tokens: Object }}
 */
function useBlockTokens({ properties }) {
  const { isDark, tokens } = useTheme();
  if (!type.isObject(properties.theme)) {
    return { isDark, tokens };
  }
  return { isDark, tokens: { ...tokens, ...properties.theme } };
}

export default useBlockTokens;
