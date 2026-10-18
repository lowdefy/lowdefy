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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import getTailwindThemeVars from '../writePluginImports/getTailwindThemeVars.js';
import createNativeClassCompiler from './tailwind/createNativeClassCompiler.js';
import createTailwindClassCheck from './tailwind/createTailwindClassCheck.js';

function tokenize(strings) {
  return strings.flatMap((value) => value.split(/[\s'"`]+/)).filter((token) => token !== '');
}

function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => (a < b ? -1 : 1)));
}

// The per-app Tailwind class map a shell styles native blocks with: every
// class candidate on mobile and shared pages that has a native form, compiled
// to a React Native style object with the app's theme. Variants are keyed by
// their full class ("dark:bg-gray-900", "sm:flex-row"). A class that looks
// different in dark mode because it uses an antd theme colour also gets a
// "dark:<class>" entry, so the shell reads "dark:<class>" before "<class>" in
// dark mode. A Tailwind class written under "class" with no native form fails
// the build; other strings are skipped.
async function buildMobileClassMap({ components, context }) {
  context.mobileClassMap = {};
  if (type.isNone(components.mobile)) {
    return components;
  }
  const themeVars = getTailwindThemeVars({ tailwindConfig: components.theme?.tailwind });
  const compiler = createNativeClassCompiler({ themeVars, mobileTheme: context.mobileTheme });
  const compiled = new Map();
  function compile(className) {
    if (!compiled.has(className)) {
      compiled.set(className, compiler.compile(className));
    }
    return compiled.get(className);
  }
  let isTailwindClass;
  const classMap = {};
  function add(className, result) {
    classMap[className] = result.style;
    if (result.darkStyle && !classMap[`dark:${className}`]) {
      classMap[`dark:${className}`] = result.darkStyle;
    }
  }
  for (const candidate of context.mobileClassCandidates ?? []) {
    const refused = new Set();
    for (const className of tokenize(candidate.classStrings)) {
      const result = compile(className);
      if (result) {
        add(className, result);
        continue;
      }
      isTailwindClass = isTailwindClass ?? (await createTailwindClassCheck({ themeVars }));
      if (!refused.has(className) && isTailwindClass(className)) {
        refused.add(className);
        collectExceptions(
          context,
          new ConfigError(
            `Class "${className}" on block "${candidate.blockId}" on page "${candidate.pageId}" has no native form, so a mobile shell cannot apply it. Mobile pages support spacing, sizing, flex and gap, colours, font size and weight, borders, radius and opacity classes, with the dark:, sm:, md: and lg: prefixes.`,
            { configKey: candidate.configKey }
          )
        );
      }
    }
    for (const className of tokenize(candidate.propertyStrings)) {
      const result = compile(className);
      if (result) {
        add(className, result);
      }
    }
  }
  context.mobileClassMap = sortKeys(classMap);
  return components;
}

export default buildMobileClassMap;
