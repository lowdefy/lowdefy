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

/* global __DEV__ */
import { useContext } from 'react';
import { ConfigError } from '@lowdefy/errors';

import BreakpointContext from '../layout/BreakpointContext.js';
import getBlockStyles from './getBlockStyles.js';
import PageStyleContext from './PageStyleContext.js';
import ThemeContext from '../theme/ThemeContext.js';

// A class put together at runtime that the build never saw has no entry, as it has no CSS on
// the web. Development builds say so once per class.
function warnMissingClass({ className, lowdefy }) {
  if (!__DEV__ || lowdefy._internal.missingClasses.has(className)) {
    return;
  }
  lowdefy._internal.missingClasses.add(className);
  lowdefy._internal.logger.warn(
    `Class "${className}" is not in the app's class map, so it has no style on mobile. Classes put together at runtime must appear as literals in config for the build to compile them.`
  );
}

// handleError logs each message and config key once.
function reportStyleError({ block, error, lowdefy, slot }) {
  lowdefy._internal.handleError(
    new ConfigError(
      `Style "${error.key}" in slot "${slot}" on block "${block.blockId}" is not supported on mobile. ${error.message}`,
      { configKey: block.eval.configKey }
    )
  );
}

// The block's style per slot for the current theme mode and breakpoint (getBlockStyles).
// `unconverted` says the build left every slot as config wrote it (a skeleton's), so each is
// converted here, as a shared page's are.
function useBlockStyles({ block, lowdefy, unconverted = false }) {
  const breakpoint = useContext(BreakpointContext);
  const { isDark } = useContext(ThemeContext);
  const { classMap, sharedPage } = useContext(PageStyleContext);
  return getBlockStyles({
    block,
    breakpoint,
    classMap,
    isDark,
    onMissingClass: (className) => warnMissingClass({ className, lowdefy }),
    onStyleError: ({ slot, error }) => reportStyleError({ block, error, lowdefy, slot }),
    sharedPage: sharedPage || unconverted,
  });
}

export default useBlockStyles;
