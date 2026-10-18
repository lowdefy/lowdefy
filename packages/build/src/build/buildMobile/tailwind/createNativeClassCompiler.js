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

import { getUnsupportedStyleMessage } from '@lowdefy/style-native';

import createNativeTailwind from './createNativeTailwind.js';
import createTokenVars from './createTokenVars.js';
import loadTailwindDefaultTheme from './loadTailwindDefaultTheme.js';
import parseClassVariants from './parseClassVariants.js';

const supportedVariants = new Set(['dark', 'sm', 'md', 'lg']);

// twrnc reports utilities it cannot parse with console.warn. The build decides
// what an unparsed class means itself, so those warnings are kept quiet.
function withoutWarnings(fn) {
  const { warn } = console;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
  }
}

function isNativeStyle(style) {
  const entries = Object.entries(style);
  return (
    entries.length > 0 &&
    entries.every(([key, value]) => getUnsupportedStyleMessage({ key, value }) === null)
  );
}

// Compiles single Tailwind classes to React Native style objects with the
// app's theme, once per colour mode. compile returns null for a class with no
// native form: an unsupported variant (hover:, xl:, group-*), a utility twrnc
// cannot parse (grid-cols-2, transition) or one whose style React Native
// cannot honour (cursor-pointer).
function createNativeClassCompiler({ themeVars, mobileTheme }) {
  const defaultTheme = loadTailwindDefaultTheme();
  const tailwind = {
    light: createNativeTailwind({
      themeVars,
      tokenVars: createTokenVars(mobileTheme.light),
      defaultTheme,
    }),
    dark: createNativeTailwind({
      themeVars,
      tokenVars: createTokenVars(mobileTheme.dark),
      defaultTheme,
    }),
  };

  function compileUtility({ utility, mode }) {
    const style = withoutWarnings(() => tailwind[mode].style(utility));
    return isNativeStyle(style) ? style : null;
  }

  // { style, darkStyle }: darkStyle is set when a class without dark: looks
  // different in dark mode, because it uses a theme colour from antd.
  function compile(className) {
    const { variants, utility } = parseClassVariants(className);
    if (utility === '' || !variants.every((variant) => supportedVariants.has(variant))) {
      return null;
    }
    if (variants.includes('dark')) {
      const style = compileUtility({ utility, mode: 'dark' });
      return style ? { style } : null;
    }
    const style = compileUtility({ utility, mode: 'light' });
    if (!style) {
      return null;
    }
    const darkStyle = compileUtility({ utility, mode: 'dark' });
    if (!darkStyle || JSON.stringify(darkStyle) === JSON.stringify(style)) {
      return { style };
    }
    return { style, darkStyle };
  }

  return { compile };
}

export default createNativeClassCompiler;
