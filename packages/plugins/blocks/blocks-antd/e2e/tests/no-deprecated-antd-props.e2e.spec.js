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

import { expect, test } from '@playwright/test';

import {
  deprecations,
  findDeprecatedPropUsage,
  knownDeprecatedUsage,
  readDeprecatedProps,
} from './deprecatedAntdProps.mjs';

// The deterministic half of the antd deprecation gate: it reads block sources and
// antd's own type declarations, never the browser, so it holds regardless of
// whether the app under test is a development or a production build. It uses no
// page fixture; Playwright hosts it only because it is the runner this package has.

function describeUsage({ component, file, line, prop }) {
  return `${file}:${line} <${component} ${prop}=...>`;
}

test.describe('no deprecated antd props', () => {
  test('every asserted prop is annotated @deprecated by the installed antd', () => {
    const asserted = new Set(knownDeprecatedUsage.map(({ prop }) => prop));
    const flagged = new Set();
    deprecations.forEach(({ types }) => {
      readDeprecatedProps({ types }).forEach((prop) => flagged.add(prop));
    });
    expect([...asserted].filter((prop) => !flagged.has(prop))).toEqual([]);
  });

  test('blocks pass no deprecated antd prop that is not a recorded debt', () => {
    const allowed = new Set(
      knownDeprecatedUsage.map(({ component, file, prop }) => `${file}|${component}|${prop}`)
    );
    const unexpected = findDeprecatedPropUsage().filter(
      ({ component, file, prop }) => !allowed.has(`${file}|${component}|${prop}`)
    );
    expect(unexpected.map(describeUsage)).toEqual([]);
  });

  test('every recorded debt is still present, so the list does not rot', () => {
    const found = new Set(
      findDeprecatedPropUsage().map(({ component, file, prop }) => `${file}|${component}|${prop}`)
    );
    const stale = knownDeprecatedUsage.filter(
      ({ component, file, prop }) => !found.has(`${file}|${component}|${prop}`)
    );
    expect(stale.map(({ component, file, prop }) => `${file} <${component} ${prop}>`)).toEqual([]);
  });
});
