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

import classStyle from './classStyle.js';
import slotStyle from './slotStyle.js';

/**
 * A block's style per slot (`block`, `element`, `label`, ...): its classes from the class map,
 * then its `style` over them. A block component lays its own defaults and theme tokens under
 * these, so the order is block defaults, theme, class, style.
 *
 * @param {Object} params
 * @param {Object} params.block The engine block, evaluated.
 * @param {string} params.breakpoint The current layout breakpoint.
 * @param {Object} params.classMap The page's class map.
 * @param {boolean} params.isDark Whether the dark theme is showing.
 * @param {boolean} params.sharedPage Whether the page is shared with the web.
 * @param {(className: string) => void} params.onMissingClass
 * @param {(params: { slot: string, error: Object }) => void} params.onStyleError
 * @returns {Object} `{ [slot]: style }`
 */
function getBlockStyles({
  block,
  breakpoint,
  classMap,
  isDark,
  onMissingClass,
  onStyleError,
  sharedPage,
}) {
  const evaluatedClass = block.eval.class ?? {};
  const evaluatedStyle = block.eval.style ?? {};
  const slots = new Set([...Object.keys(evaluatedClass), ...Object.keys(evaluatedStyle)]);
  const styles = {};
  slots.forEach((slot) => {
    styles[slot] = {
      ...classStyle({
        breakpoint,
        classMap,
        classValue: evaluatedClass[slot],
        isDark,
        onMissing: onMissingClass,
      }),
      ...slotStyle({
        onError: (error) => onStyleError({ slot, error }),
        rawSlot: block.style?.[slot],
        sharedPage,
        slotStyle: evaluatedStyle[slot],
      }),
    };
  });
  return styles;
}

export default getBlockStyles;
