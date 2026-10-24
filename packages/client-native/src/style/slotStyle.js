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

import { getOperatorType, type } from '@lowdefy/helpers';
import { convertStyle } from '@lowdefy/style-native';

function isOperator(value) {
  return getOperatorType(value) !== null;
}

function holdsOperator(rawSlot) {
  return isOperator(rawSlot) || (type.isObject(rawSlot) && Object.values(rawSlot).some(isOperator));
}

/**
 * One slot's evaluated style as React Native reads it. The build converts the literal slots of
 * mobile-only pages; the renderer converts, with the same converter, the slots of a shared page
 * (the web reads the same page JSON) and any slot that is or holds an operator. A slot the build
 * converted is never converted again.
 *
 * @param {Object} params
 * @param {*} params.rawSlot The slot as config wrote it, before operators ran.
 * @param {Object} [params.slotStyle] The slot's evaluated style.
 * @param {boolean} params.sharedPage Whether the page is shared with the web (target: both).
 * @param {(error: { key: string, message: string }) => void} params.onError Called for each key
 *   React Native cannot honour; the key is left out.
 */
function slotStyle({ onError, rawSlot, sharedPage, slotStyle: style }) {
  if (!type.isObject(style)) {
    return {};
  }
  if (!sharedPage && !holdsOperator(rawSlot)) {
    return style;
  }
  const converted = convertStyle(style);
  converted.errors.forEach(onError);
  return converted.style;
}

export default slotStyle;
