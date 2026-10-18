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
 * The height, font size and horizontal padding of an input or button for its `size`. A phone is
 * touched, not clicked, so each size is a step taller than antd's: the default size takes antd's
 * large control height and `small` its default one.
 *
 * @param {Object} params
 * @param {string} [params.size] 'small', 'default' or 'middle' (the same), or 'large'.
 * @param {Object} params.tokens The block's antd tokens.
 * @returns {{ height: number, fontSize: number, paddingHorizontal: number }}
 */
function getControlSize({ size, tokens }) {
  if (size === 'small') {
    return {
      height: tokens.controlHeight,
      fontSize: tokens.fontSize,
      paddingHorizontal: tokens.paddingXS,
    };
  }
  if (size === 'large') {
    return {
      height: tokens.controlHeightLG + tokens.paddingXS,
      fontSize: tokens.fontSizeLG,
      paddingHorizontal: tokens.paddingSM,
    };
  }
  return {
    height: tokens.controlHeightLG,
    fontSize: tokens.fontSizeLG,
    paddingHorizontal: tokens.paddingSM,
  };
}

export default getControlSize;
