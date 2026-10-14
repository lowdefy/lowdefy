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

import importPluginModule from '../writePluginImports/importPluginModule.js';
import isPluginPackageInstalled from './isPluginPackageInstalled.js';
import pluginCheckKinds from './pluginCheckKinds.js';

const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LEVELS = new Set(['error', 'warning']);

function findRuleProblem(rule) {
  if (!type.isObject(rule)) {
    return `a rule is not an object. Received ${JSON.stringify(rule)}.`;
  }
  if (!type.isString(rule.id) || !kebabCase.test(rule.id)) {
    return `rule id ${JSON.stringify(rule.id)} is not a kebab-case string.`;
  }
  if (!LEVELS.has(rule.level)) {
    return `rule ${rule.id} level must be "error" or "warning". Received ${JSON.stringify(
      rule.level
    )}.`;
  }
  if (!type.isFunction(rule.check)) {
    return `rule ${rule.id} check is not a function.`;
  }
  return null;
}

function findChecksProblem(checks) {
  if (!type.isObject(checks)) {
    return 'the default export is not an object.';
  }
  for (const [kind, rulesByType] of Object.entries(checks)) {
    if (!pluginCheckKinds.includes(kind)) {
      return `"${kind}" is not one of ${pluginCheckKinds.join(', ')}.`;
    }
    if (!type.isObject(rulesByType)) {
      return `"${kind}" is not an object of rule lists keyed by type.`;
    }
    for (const [typeName, rules] of Object.entries(rulesByType)) {
      if (!type.isArray(rules)) {
        return `${kind}.${typeName} is not a list of rules.`;
      }
      for (const rule of rules) {
        const problem = findRuleProblem(rule);
        if (problem) {
          return `${kind}.${typeName}: ${problem}`;
        }
      }
    }
  }
  return null;
}

// One package's `./checks`, as one of:
// - { status: 'loaded', checks }: the rules, keyed by kind and type;
// - { status: 'none' }: installed, with no `./checks`;
// - { status: 'pending' }: not installed, so its rules are unknown;
// - { status: 'failed', message }: `./checks` threw on load or has the wrong shape.
async function loadPluginChecks({ context, packageName }) {
  let checksModule;
  try {
    checksModule = await importPluginModule({ context, specifier: `${packageName}/checks` });
  } catch (error) {
    return { status: 'failed', message: error.message };
  }
  if (type.isUndefined(checksModule)) {
    if (isPluginPackageInstalled({ context, packageName })) {
      return { status: 'none' };
    }
    return { status: 'pending' };
  }
  const checks = checksModule.default;
  const problem = findChecksProblem(checks);
  if (problem) {
    return { status: 'failed', message: problem };
  }
  return { status: 'loaded', checks };
}

export default loadPluginChecks;
