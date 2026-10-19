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

/**
 * The iOS search field: 36 points tall, a rounded fill in the tertiary system fill, body text.
 *
 * @param {Object} params
 * @param {boolean} params.disabled
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ box: Object, text: Object }}
 */
function getSearchBoxStyle({ disabled, tokens }) {
  return {
    box: {
      alignItems: 'center',
      backgroundColor: tokens.colorTertiarySystemFill,
      borderRadius: 10,
      flexDirection: 'row',
      minHeight: 36,
      opacity: disabled ? 0.6 : 1,
      paddingHorizontal: 8,
    },
    text: {
      color: tokens.colorLabel,
      fontSize: 17,
    },
  };
}

export default getSearchBoxStyle;
