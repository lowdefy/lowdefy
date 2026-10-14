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

import {
  ConfigError,
  ConfigWarning,
  PLUGIN_CHECKS_SLUG,
  VALID_CHECK_SLUGS,
} from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import collectRuleTargets from './pluginChecks/collectRuleTargets.js';
import loadPluginChecks from './pluginChecks/loadPluginChecks.js';
import runRule from './pluginChecks/runRule.js';

// The packages whose rule ids ~ignoreBuildChecks may name. A dev page build
// sees only its own page's types, so it also takes every installed plugin
// package the app's types map names: a slug valid in the full build must not
// fail one page in dev because that page does not use the rule's package.
function collectSlugPackages({ context, targetPackages }) {
  const packages = new Set(targetPackages);
  if (!context.installedPluginPackages) {
    return packages;
  }
  const { typesMap } = context;
  const sections = [
    typesMap.blocks,
    typesMap.actions,
    typesMap.requests,
    typesMap.connections,
    typesMap.operators.client,
    typesMap.operators.server,
  ];
  for (const definitions of sections) {
    for (const definition of Object.values(definitions ?? {})) {
      if (context.installedPluginPackages.has(definition.package)) {
        packages.add(definition.package);
      }
    }
  }
  return packages;
}

async function loadPackages({ context, packageNames }) {
  context.pluginChecksCache ??= new Map();
  const loaded = new Map();
  for (const packageName of [...packageNames].sort()) {
    if (!context.pluginChecksCache.has(packageName)) {
      context.pluginChecksCache.set(packageName, await loadPluginChecks({ context, packageName }));
    }
    loaded.set(packageName, context.pluginChecksCache.get(packageName));
  }
  return loaded;
}

function reportLoadFailures({ context, loaded }) {
  for (const [packageName, result] of loaded) {
    if (result.status !== 'failed') continue;
    const message = `Plugin checks for ${packageName} could not load: ${result.message}`;
    // The skip flag is the escape hatch for a broken plugin, so a ./checks
    // that does not load must not stop a build that skips plugin rules.
    if (context.skipPluginChecks) {
      context.handleWarning(new ConfigWarning(message));
    } else {
      collectExceptions(context, new ConfigError(message));
    }
  }
}

// Warns once for each id two sources share, and returns every known id.
function warnClashes({ context, loaded }) {
  const sources = new Map();
  const addSource = (id, source) => {
    if (!sources.has(id)) {
      sources.set(id, new Set());
    }
    sources.get(id).add(source);
  };
  for (const slug of [...Object.keys(VALID_CHECK_SLUGS), PLUGIN_CHECKS_SLUG]) {
    addSource(slug, 'a built-in check');
  }
  for (const [packageName, result] of loaded) {
    if (result.status !== 'loaded') continue;
    for (const rulesByType of Object.values(result.checks)) {
      for (const rules of Object.values(rulesByType)) {
        rules.forEach((rule) => addSource(rule.id, packageName));
      }
    }
  }
  for (const [id, idSources] of sources) {
    if (idSources.size < 2) continue;
    context.handleWarning(
      new ConfigWarning(
        `Check id "${id}" is used by ${[...idSources].join(
          ' and '
        )}. Both checks run, and ~ignoreBuildChecks: [${id}] silences both.`
      )
    );
  }
  return new Set(sources.keys());
}

function validateSlugs({ context, knownIds }) {
  for (const [slug, configKeys] of context.pluginCheckSlugRefs ?? []) {
    if (knownIds.has(slug)) continue;
    for (const configKey of configKeys) {
      collectExceptions(
        context,
        new ConfigError(
          `~ignoreBuildChecks slug "${slug}" is not a built-in check or a rule of any plugin the app uses.`,
          { configKey }
        )
      );
    }
  }
}

function reportMessage({ context, rule, node, message }) {
  const options = {
    configKey: node['~k'],
    checkSlug: rule.id,
    checkGroup: PLUGIN_CHECKS_SLUG,
  };
  if (rule.level === 'warning') {
    context.handleWarning(new ConfigWarning(message, options));
    return;
  }
  collectExceptions(context, new ConfigError(message, options));
}

function runRules({ context, targets, loaded }) {
  for (const { kind, typeName, originalTypeName, packageName, nodes } of targets) {
    const result = loaded.get(packageName);
    if (result.status !== 'loaded') continue;
    const rules = result.checks[kind]?.[originalTypeName] ?? [];
    for (const node of nodes) {
      for (const rule of rules) {
        for (const message of runRule({ rule, packageName, kind, typeName, node })) {
          reportMessage({ context, rule, node, message });
        }
      }
    }
  }
}

// Runs each used plugin's build check rules on the config nodes the type
// counters recorded. Runs once the counting steps are done and before buildJs
// replaces the counted objects. Returns the packages the app uses that are not
// installed yet, for writePluginChecksPending.
async function runPluginChecks({ context }) {
  const targets = collectRuleTargets({ context });
  const targetPackages = new Set(targets.map((target) => target.packageName));
  const loaded = await loadPackages({
    context,
    packageNames: collectSlugPackages({ context, targetPackages }),
  });

  reportLoadFailures({ context, loaded });
  const knownIds = warnClashes({ context, loaded });
  const rulesUnknown = [...loaded.values()].some(
    (result) => result.status === 'pending' || result.status === 'failed'
  );
  if (!rulesUnknown) {
    validateSlugs({ context, knownIds });
  }

  const pending = [...targetPackages].filter(
    (packageName) => loaded.get(packageName).status === 'pending'
  );
  pending.forEach((packageName) =>
    context.handleWarning(
      new ConfigWarning(`Plugin checks for ${packageName} did not run: package not installed.`)
    )
  );

  if (context.skipPluginChecks) {
    context.handleWarning(new ConfigWarning('Plugin checks were skipped (--skip-plugin-checks).'));
    return { pending };
  }
  runRules({ context, targets, loaded });
  return { pending };
}

export default runPluginChecks;
