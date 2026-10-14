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
  PLUGIN_SCHEMA_SLUG,
  VALID_CHECK_SLUGS,
} from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import collectRuleTargets from './pluginChecks/collectRuleTargets.js';
import loadPluginChecks from './pluginChecks/loadPluginChecks.js';
import runRule from './pluginChecks/runRule.js';
import runSchemaChecks from './pluginChecks/runSchemaChecks.js';

// The packages whose rule ids ~ignoreBuildChecks may name. The full build
// counts every type, so its used packages are all of them. A dev build counts
// only part of the app (the skeleton strips ref-backed pages; a page build sees
// one page), so it passes allSlugPackages to take every package the types map
// names. A slug valid in the full build must not fail a dev build because the
// rule's package is used on another page.
// A package that is not installed loads as pending, which leaves the slugs
// unchecked rather than failing them.
function collectSlugPackages({ context, targetPackages, allSlugPackages }) {
  const packages = new Set(targetPackages);
  if (!allSlugPackages) {
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
      packages.add(definition.package);
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

function reportLoadFailures({ context, loaded, targetPackages }) {
  for (const [packageName, result] of loaded) {
    // A package loaded only for its rule ids runs no rule here, so its
    // failure only leaves the slugs unchecked.
    if (result.status !== 'failed' || !targetPackages.has(packageName)) continue;
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

// Warns once for each id two sources of running rules share, and returns every
// id a slug may name.
function warnClashes({ context, loaded, targetPackages }) {
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
  const knownIds = new Set(sources.keys());
  for (const [packageName, result] of loaded) {
    if (result.status !== 'loaded') continue;
    for (const rulesByType of Object.values(result.checks)) {
      for (const rules of Object.values(rulesByType)) {
        rules.forEach((rule) => {
          knownIds.add(rule.id);
          if (targetPackages.has(packageName)) {
            addSource(rule.id, packageName);
          }
        });
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
  return knownIds;
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

function reportFinding({ context, level, slug, configKey, message }) {
  const options = {
    configKey,
    checkSlug: slug,
    checkGroup: PLUGIN_CHECKS_SLUG,
  };
  if (level === 'warning') {
    const warning = new ConfigWarning(message, options);
    // Warnings are listed once per source line by default; each message at a
    // node is its own warning.
    warning.dedupKey = `${configKey}\n${slug}\n${message}`;
    context.handleWarning(warning);
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
          reportFinding({
            context,
            level: rule.level,
            slug: rule.id,
            configKey: node['~k'],
            message,
          });
        }
      }
    }
  }
}

// Runs each used plugin's build check rules, and checks blocks, actions and
// operators against their plugin schemas, on the config nodes the type
// counters recorded. Runs once the counting steps are done and before buildJs
// replaces the counted objects. Returns the packages the app uses that are not
// installed yet, for writePluginChecksPending. A dev build passes
// allSlugPackages (see collectSlugPackages).
async function runPluginChecks({ context, allSlugPackages = false }) {
  const targets = collectRuleTargets({ context });
  const targetPackages = new Set(targets.map((target) => target.packageName));
  const loaded = await loadPackages({
    context,
    packageNames: collectSlugPackages({ context, targetPackages, allSlugPackages }),
  });

  reportLoadFailures({ context, loaded, targetPackages });
  const knownIds = warnClashes({ context, loaded, targetPackages });
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
  const schemaFindings = await runSchemaChecks({ context, targets, loaded });
  schemaFindings.forEach((finding) =>
    reportFinding({ context, slug: PLUGIN_SCHEMA_SLUG, ...finding })
  );
  return { pending };
}

export default runPluginChecks;
