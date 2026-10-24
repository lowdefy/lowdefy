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

import { textStyles } from '@lowdefy/client-native';

/**
 * The React Native text style of an iOS text style in the theme's label colour: the helper every
 * native block sets its text with, so text sizes follow the platform. The styles are largeTitle
 * (34), title1 (28), title2 (22), title3 (20), headline (17 semibold), body (17), callout (16),
 * subheadline (15), footnote (13), caption1 (12) and caption2 (11).
 *
 * @param {Object} params
 * @param {string} params.textStyle The iOS text style name.
 * @param {Object} params.tokens The block's theme tokens.
 * @param {string} [params.color] The text colour; colorLabel when not given.
 * @returns {{ color: string, fontSize: number, fontWeight: string, lineHeight: number }}
 */
function getIosTextStyle({ color, textStyle, tokens }) {
  return { ...textStyles[textStyle], color: color ?? tokens.colorLabel };
}

export default getIosTextStyle;
