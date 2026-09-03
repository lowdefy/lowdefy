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
import { jest } from '@jest/globals';

import runChecks, { rules } from './index.js';
import jsLint from './jsLint.js';
import tenantRules from './tenant/index.js';

test('runChecks registers the js-lint rule first so normal builds lint _js bodies', () => {
  expect(rules[0]).toBe(jsLint);
  expect(rules[0].checkOnly).toBe(false);
});

test('runChecks registers the five tenant rules after js-lint, F1 for builds and the rest check-only', () => {
  expect(rules.slice(1, 6)).toEqual(tenantRules);
  expect(tenantRules.map((rule) => rule.slug)).toEqual([
    'tenant',
    'tenant',
    'tenant',
    'tenant',
    'tenant',
  ]);
  expect(tenantRules.map((rule) => rule.checkOnly)).toEqual([false, true, true, true, true]);
});

test('runChecks runs a checkOnly rule under check and skips it during a build', () => {
  const run = jest.fn();
  rules.push({ slug: 'test-only', checkOnly: true, run });
  try {
    const components = { pages: [] };
    const buildContext = { validateOnly: false, jsBodies: [] };
    expect(runChecks({ components, context: buildContext })).toBe(components);
    expect(run).not.toHaveBeenCalled();

    const checkContext = { validateOnly: true, jsBodies: [] };
    runChecks({ components, context: checkContext });
    expect(run).toHaveBeenCalledWith({ components, context: checkContext });
  } finally {
    rules.pop();
  }
});

test('runChecks runs a rule that is not checkOnly in both modes', () => {
  const run = jest.fn();
  rules.push({ slug: 'always', checkOnly: false, run });
  try {
    runChecks({ components: {}, context: { validateOnly: false, jsBodies: [] } });
    runChecks({ components: {}, context: { validateOnly: true, jsBodies: [] } });
    expect(run).toHaveBeenCalledTimes(2);
  } finally {
    rules.pop();
  }
});
