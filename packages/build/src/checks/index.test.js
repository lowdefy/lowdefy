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
import collectionsRules from './collections/index.js';
import secretsRules from './secrets/index.js';
import layoutRules from './layout/index.js';
import filePluginRules from './filePlugins/index.js';

test('runChecks registers the js-lint rule first so normal builds lint _js bodies', () => {
  expect(rules[0]).toBe(jsLint);
  expect(rules[0].checkOnly).toBe(false);
});

test('runChecks registers the tenant rules after js-lint, the build-failing ones first', () => {
  expect(rules.slice(1, 1 + tenantRules.length)).toEqual(tenantRules);
  expect(tenantRules.map((rule) => rule.slug)).toEqual([
    'tenant-authored',
    'tenant-unscoped',
    'tenant-none-deprecated',
    'tenant-unscoped',
    'tenant-caller-source',
    'tenant-unstamped-write',
    'request-state-empty',
    'tenant-inventory',
  ]);
  expect(tenantRules.map((rule) => rule.checkOnly)).toEqual([
    false,
    false,
    false,
    true,
    true,
    true,
    true,
    true,
  ]);
});

test('runChecks registers the secrets rule after the collections rules, check-only', () => {
  const secretsIndex = 1 + tenantRules.length + collectionsRules.length;
  expect(rules.slice(secretsIndex, secretsIndex + secretsRules.length)).toEqual(secretsRules);
  expect(secretsRules.map((rule) => rule.slug)).toEqual(['secrets']);
  expect(secretsRules.map((rule) => rule.checkOnly)).toEqual([true]);
});

test('runChecks registers the layout deprecation rule, check-only', () => {
  layoutRules.forEach((rule) => expect(rules).toContain(rule));
  expect(layoutRules.map((rule) => rule.slug)).toEqual(['layout-deprecated']);
  expect(layoutRules.map((rule) => rule.checkOnly)).toEqual([true]);
});

test('runChecks registers the file-plugin lint last, on every build', () => {
  const filePluginIndex =
    1 + tenantRules.length + collectionsRules.length + secretsRules.length + layoutRules.length;
  expect(rules.slice(filePluginIndex)).toEqual(filePluginRules);
  expect(filePluginRules.map((rule) => rule.slug)).toEqual(['js-lint']);
  expect(filePluginRules.map((rule) => rule.checkOnly)).toEqual([false]);
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
