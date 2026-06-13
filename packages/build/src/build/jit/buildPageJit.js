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

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { serializer, type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import { compileDir } from '@lowdefy/compile';
import { createScope, bindModuleEntry, runtime } from '@lowdefy/compile/runtime';

import addKeys from '../addKeys.js';
import buildPage from '../buildPages/buildPage.js';
import validateCallApiRefs from '../buildPages/validateCallApiRefs.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createContext from '../../createContext.js';
import collectExceptions from '../../utils/collectExceptions.js';
import evaluateStaticOperators from '../evaluateStaticOperators.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import makeId from '../../utils/makeId.js';
import {
  makeRefTracker,
  makeResolveModuleVarDefault,
  makeScopeFileAccess,
  runtimePath,
} from '../compileScopeTools.js';
import detectMissingIcons from './detectMissingIcons.js';
import detectMissingPluginPackages from './detectMissingPluginPackages.js';
import updateIconImportsJit from './updateIconImportsJit.js';
import updateServerPackageJsonJit from './updateServerPackageJsonJit.js';
import validatePageTypes from './validatePageTypes.js';
import writePageJit from './writePageJit.js';

async function updateDynamicIcons({ page, context }) {
  if (!context.iconImports) return;
  const missingIcons = detectMissingIcons({ page, iconImports: context.iconImports });
  if (missingIcons.length > 0) {
    await updateIconImportsJit({
      newIcons: missingIcons,
      iconImports: context.iconImports,
      context,
    });
  }
}

async function buildPageJit({ pageId, pageRegistry, context, directories, logger }) {
  // Use provided context or create a minimal one for JIT builds
  const buildContext =
    context ??
    createContext({
      directories,
      logger: logger ?? console,
      stage: 'dev',
    });

  const pageEntry = type.isFunction(pageRegistry.get)
    ? pageRegistry.get(pageId)
    : pageRegistry[pageId];

  if (!pageEntry) {
    return null;
  }

  // Reset errors and warnings for this build. Keep local references so that
  // concurrent JIT builds (different pages sharing buildContext) cannot corrupt
  // our lists by reassigning during an await.
  const buildErrors = [];
  const buildWarnings = [];
  buildContext.errors = buildErrors;
  buildContext.warnings = buildWarnings;

  // Namespaced keys (`p:<pageId>:<n>`, counter reset per build) make JIT
  // builds deterministic — rebuilding a page produces identical keys, so
  // byte-identical config yields byte-identical artifacts and the shared
  // keyMap stays bounded. Callers (the dev server) serialize page builds, so
  // the singleton namespace cannot interleave.
  makeId.enterNamespace(`p:${pageId}`);

  try {
    // Pages without a source file (e.g., default 404) can only be served from
    // their pre-built artifact — they have no YAML to re-resolve from.
    // All user pages (with refId) always JIT-resolve from source YAML so that
    // page-only edits are picked up without a skeleton rebuild.
    if (!pageEntry.refId) {
      const pagePath = path.join(buildContext.directories.build, 'pages', `${pageId}.json`);
      try {
        const content = await fs.promises.readFile(pagePath, 'utf8');
        const page = serializer.deserialize(JSON.parse(content));

        await updateDynamicIcons({ page, context: buildContext });
        return page;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }

    // If this is a module page, set up module context
    let moduleDependencies = null;
    let moduleEntry = null;
    if (pageEntry.moduleEntryId) {
      moduleEntry = buildContext.modules[pageEntry.moduleEntryId];
      moduleDependencies = moduleEntry?.moduleDependencies ?? null;
    }

    // Resolve the page file from scratch using the source file path determined
    // by createPageRegistry's parent chain walk.
    if (!pageEntry.refPath && !pageEntry.resolverOriginal) {
      throw new ConfigError(
        `Page "${pageId}" has no source file reference. Cannot resolve page content.`
      );
    }

    // Full S4 (E3): the page resolves by re-running its compiled factory.
    // A fresh per-build graph (new outDir = new ESM module URLs) picks up
    // every edited file in the page's static ref subtree; the build cache
    // dir is cleaned after import.
    const configDir = buildContext.directories.config;
    fs.mkdirSync(buildContext.directories.build, { recursive: true });
    const outDir = fs.realpathSync(
      fs.mkdtempSync(path.join(buildContext.directories.build, '.compile-jit-'))
    );

    const moduleBinding = moduleEntry
      ? bindModuleEntry({
          id: moduleEntry.id,
          consumerVars: moduleEntry.consumerVars ?? {},
          varDefs: moduleEntry.varDefs ?? {},
          connections: moduleEntry.connections ?? {},
          deps: moduleEntry.moduleDependencies ?? {},
          resolvedVarCache: moduleEntry.resolvedVarCache,
        })
      : null;

    function makeJitScope(graph) {
      return createScope({
        vars: {},
        importer: graph.importer,
        importSource: graph.importSource,
        file: pageEntry.refPath ?? null,
        refChain: [],
        onError: (error) => {
          collectExceptions(buildContext, error);
        },
        env: process.env,
        refId: null,
        walkPath: '',
        refTracker: makeRefTracker(buildContext),
        getModuleEntry: (id) => buildContext.modules?.[id],
        resolveModuleVarDefault: makeResolveModuleVarDefault(buildContext),
        ...makeScopeFileAccess(buildContext),
        unresolvedRefVars: buildContext.unresolvedRefVars ?? {},
        module: moduleBinding,
      });
    }

    let processed;
    try {
      let graph;
      if (pageEntry.resolverOriginal) {
        // Resolver pages re-run the resolver — content compiles through
        // importSource, so a graph rooted anywhere works; use the entry.
        graph = await compileDir({
          configDir,
          outDir,
          entry: fs.existsSync(path.join(configDir, 'lowdefy.yaml'))
            ? 'lowdefy.yaml'
            : 'lowdefy.yml',
          mode: 'markers',
          runtimePath,
          refResolver: buildContext.refResolver ?? null,
          // The entry only anchors the graph — nothing resolves from it.
          entryPreserveZones: () => true,
        });
      } else {
        graph = await compileDir({
          configDir,
          outDir,
          entry: pageEntry.refPath,
          mode: 'markers',
          runtimePath,
          refResolver: buildContext.refResolver ?? null,
          entryModuleRoot: moduleEntry?.moduleRoot ?? null,
        });
      }

      // Unresolved vars (which may contain inner _ref objects and operators)
      // resolve fresh — directive-bearing vars compile through importSource.
      const unresolvedVars = pageEntry.unresolvedVars ?? pageEntry.resolverOriginal?.vars;
      let resolvedVars = null;
      if (unresolvedVars) {
        const varsScope = makeJitScope(graph);
        if (type.isObject(unresolvedVars) || type.isArray(unresolvedVars)) {
          const varsMod = await graph.importSource(
            YAML.stringify(unresolvedVars),
            `jit:vars:${pageId}`
          );
          resolvedVars = await varsMod.default(varsScope);
        } else {
          resolvedVars = unresolvedVars;
        }
      }

      const scope = makeJitScope(graph);
      if (pageEntry.resolverOriginal) {
        const def = pageEntry.resolverOriginal;
        processed = await runtime.resolverRef({
          scope,
          resolver: def.resolver,
          path: def.path,
          def,
          vars: resolvedVars ?? def.vars ?? {},
          key: def.key ?? null,
          transformer: null,
          transformerPath: null,
          ignoreBuildChecks: undefined,
          sitePath: '',
          refLine: undefined,
          loc: null,
        });
      } else {
        const mod = await graph.importer(pageEntry.refPath, moduleEntry?.moduleRoot ?? null);
        processed = await runtime.ref({
          scope,
          factory: mod.default,
          file: pageEntry.refPath,
          vars: resolvedVars ?? {},
          key: null,
          transformer: null,
          transformerPath: null,
          ignoreBuildChecks: undefined,
          sitePath: '',
          refLine: undefined,
          loc: { file: pageEntry.refPath, line: null },
        });
      }
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }

    processed = evaluateStaticOperators({
      context: buildContext,
      input: processed,
      refDef: { path: pageEntry.refPath ?? null },
    });

    // When resolving from a collection file (with vars), the result is an array of pages.
    // Find the specific page by ID. For module pages, source IDs are unscoped.
    if (type.isArray(processed)) {
      const unscopedId = moduleEntry ? pageId.slice(`${moduleEntry.id}/`.length) : pageId;
      processed = processed.find((p) => type.isObject(p) && p.id === unscopedId);
      if (!processed) {
        throw new ConfigError(`Page "${pageId}" not found in resolved page source file.`);
      }
    }

    // JIT builds resolve from source YAML — the page ID is unscoped for module pages
    if (moduleEntry && type.isObject(processed) && processed.id) {
      processed.id = `${moduleEntry.id}/${processed.id}`;
    }

    // ~r provenance is applied by the runtime ref (markDeep at completion)
    // with the refMap entry it allocated — no separate tagging pass.

    // Apply skeleton-computed auth (buildAuth ran during skeleton build)
    processed.auth = pageEntry.auth;

    // Add keys to the resolved page
    addKeys({ components: processed, context: buildContext });

    // Initialize action ref collections for buildPage (normally done by buildPages)
    if (!buildContext.linkActionRefs) {
      buildContext.linkActionRefs = [];
    }
    if (!buildContext.callApiActionRefs) {
      buildContext.callApiActionRefs = [];
    }

    // Build the page (validation, block processing)
    const checkDuplicatePageId = createCheckDuplicateId({
      message: 'Duplicate pageId "{{ id }}".',
    });
    buildPage({ page: processed, index: 0, context: buildContext, checkDuplicatePageId });

    // Validate that all page-level types (blocks, actions, operators) exist
    validatePageTypes({ context: buildContext });

    // Detect plugin packages that are in typesMap but not installed in server
    const missingPackages = detectMissingPluginPackages({
      context: buildContext,
      installedPluginPackages: buildContext.installedPluginPackages,
    });
    if (missingPackages.size > 0) {
      if (buildContext.directories.server) {
        await updateServerPackageJsonJit({
          directories: buildContext.directories,
          missingPackages,
        });
      }
      return { installing: true, packages: [...missingPackages.keys()] };
    }

    // Detect icons in the JIT-resolved page that weren't discovered during skeleton build.
    // Placed after detectMissingPluginPackages so we skip this when packages are being
    // installed (the server restarts and icons will be discovered on the next build).
    await updateDynamicIcons({ page: processed, context: buildContext });

    // Validate link, state, payload, and server-state references
    const pageIds = type.isFunction(pageRegistry.keys)
      ? [...pageRegistry.keys()]
      : Object.keys(pageRegistry);
    validateLinkReferences({
      linkActionRefs: buildContext.linkActionRefs,
      pageIds,
      context: buildContext,
    });
    const endpointConfigs = type.isArray(buildContext.components?.api)
      ? buildContext.components.api
      : [];
    validateCallApiRefs({
      callApiActionRefs: buildContext.callApiActionRefs,
      endpointConfigs,
      context: buildContext,
    });
    validateStateReferences({ page: processed, context: buildContext });
    validatePayloadReferences({ page: processed, context: buildContext });
    validateServerStateReferences({ page: processed, context: buildContext });

    // Extract JS functions from the page
    const pageRequests = [...(processed.requests ?? [])];
    delete processed.requests;
    const cleanPage = jsMapParser({ input: processed, jsMap: buildContext.jsMap, env: 'client' });
    const cleanRequests = jsMapParser({
      input: pageRequests,
      jsMap: buildContext.jsMap,
      env: 'server',
    });
    const finalPage = { ...cleanPage, requests: cleanRequests };

    // Check for collected errors from validation steps
    if (buildErrors.length > 0) {
      const error = new ConfigError(
        `Page "${pageId}" build failed with ${buildErrors.length} error(s).`
      );
      error.buildErrors = buildErrors;
      throw error;
    }

    // Write page artifacts
    const { tailwindChanged } = await writePageJit({ page: finalPage, context: buildContext });

    // Attached after the disk write (like _warnings) so it never persists in
    // artifacts — the JIT server uses it to decide whether to trigger a CSS
    // recompile for newly discovered tailwind class candidates.
    finalPage._tailwindChanged = tailwindChanged;

    // Attach warnings after disk write so they don't persist in artifacts
    if (buildWarnings.length > 0) {
      finalPage._warnings = buildWarnings.map((w) => ({
        type: w.name ?? 'ConfigWarning',
        message: w.message,
        source: w.source ?? null,
        stack: w.stack ?? null,
      }));
    }

    return finalPage;
  } catch (err) {
    // Attach any collected errors to the thrown error
    if (buildErrors.length > 0 && !err.buildErrors) {
      err.buildErrors = [err, ...buildErrors];
    }
    if (err.isLowdefyError) {
      throw err;
    }
    const lowdefyErr = new LowdefyInternalError(err.message, { cause: err });
    lowdefyErr.buildErrors = err.buildErrors;
    throw lowdefyErr;
  } finally {
    makeId.exitNamespace();
  }
}

export default buildPageJit;
