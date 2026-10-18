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

import { breakpointIndex } from '@lowdefy/layout-native';

import classTokens from './classTokens.js';
import parseClassVariants from './parseClassVariants.js';

const BREAKPOINT_VARIANTS = new Set(['sm', 'md', 'lg']);
// Tailwind writes breakpoint variants after plain classes, smallest first, and dark variants after
// all of those, so a later rank wins a property, as the later CSS rule does on the web.
const DARK_RANK = 10;

// The rank a class applies at, or null when its variants do not all hold now. A variant the map
// cannot hold (hover:) never holds.
function variantRank({ breakpoint, isDark, variants }) {
  let darkRank = 0;
  let breakpointRank = 0;
  for (const variant of variants) {
    if (variant === 'dark') {
      if (!isDark) return null;
      darkRank = DARK_RANK;
    } else if (BREAKPOINT_VARIANTS.has(variant)) {
      const index = breakpointIndex(variant);
      if (breakpointIndex(breakpoint) < index) return null;
      breakpointRank = Math.max(breakpointRank, index);
    } else {
      return null;
    }
  }
  return darkRank + breakpointRank;
}

// In dark mode a class that uses an antd theme colour reads its "dark:<class>" entry, which the
// build adds only for those classes.
function entryFor({ classMap, className, isDark, variants }) {
  if (isDark && !variants.includes('dark') && Object.hasOwn(classMap, `dark:${className}`)) {
    return classMap[`dark:${className}`];
  }
  return classMap[className];
}

/**
 * The React Native style of one slot's class value, from the app's class map. Plain classes
 * apply always, `dark:` classes in dark mode, and `sm:`, `md:` and `lg:` classes from their
 * breakpoint up. Later classes win a property within a rank, as the web's twMerge keeps the last.
 *
 * @param {Object} params
 * @param {*} params.classValue The slot's evaluated class value (string, array or object).
 * @param {Object} params.classMap `{ [className]: style }`, from the build.
 * @param {boolean} params.isDark Whether the dark theme is showing.
 * @param {string} params.breakpoint The current layout breakpoint.
 * @param {(className: string) => void} params.onMissing Called for a class the map does not hold.
 * @returns {Object} The merged style.
 */
function classStyle({ breakpoint, classMap, classValue, isDark, onMissing }) {
  const applied = [];
  classTokens(classValue).forEach((className, position) => {
    if (!Object.hasOwn(classMap, className)) {
      onMissing(className);
      return;
    }
    const { variants } = parseClassVariants(className);
    const rank = variantRank({ breakpoint, isDark, variants });
    if (rank === null) return;
    applied.push({ position, rank, style: entryFor({ classMap, className, isDark, variants }) });
  });
  applied.sort((a, b) => a.rank - b.rank || a.position - b.position);
  return Object.assign({}, ...applied.map(({ style }) => style));
}

export default classStyle;
