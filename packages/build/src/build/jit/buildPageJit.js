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
import { serializer, type } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import addKeys from '../addKeys.js';
import buildPage from '../buildPages/buildPage.js';
import validateCallApiRefs from '../buildPages/validateCallApiRefs.js';
import validateDynamicBlockRefs from '../buildPages/validateDynamicBlockRefs.js';
import validateLinkReferences from '../buildPages/validateLinkReferences.js';
import validatePayloadReferences from '../buildPages/validatePayloadReferences.js';
import validateServerStateReferences from '../buildPages/validateServerStateReferences.js';
import validateOrgClientActionRefs from '../buildPages/validateOrgClientActionRefs.js';
import validateStateReferences from '../buildPages/validateStateReferences.js';
import validateWebsocketRefs from '../buildPages/validateWebsocketRefs.js';
import collectPageContent from '../collectPageContent.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createContext from '../../createContext.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import lowdefySchema from '../../lowdefySchema.js';
import { tagRefDeep } from '../buildRefs/walker.js';
import testSchema from '../testSchema.js';
import validateIconNames from '../icons/validateIconNames.js';
import createPageBuildContext from './createPageBuildContext.js';
import detectMissingIcons from './detectMissingIcons.js';
import detectMissingPluginPackages from './detectMissingPluginPackages.js';
import getJitIconContext from './getJitIconContext.js';
import prepareJitContext from './prepareJitContext.js';
import resolvePageSource from './resolvePageSource.js';
import updateIconImportsJit from './updateIconImportsJit.js';
import updateServerPackageJsonJit from './updateServerPackageJsonJit.js';
import scanJitMaps from './scanJitMaps.js';
import validatePageTypes from './validatePageTypes.js';
import writeJitMaps from './writeJitMaps.js';
import writePageJit from './writePageJit.js';

// A page is a block, so its content is checked against the block definition -
// the part of the app schema the skeleton build skips, since it strips page
// content. One object, so the compiled validator is reused across builds.
const pageSchema = { definitions: lowdefySchema.definitions, $ref: '#/definitions/block' };

// A page resolved from source is validated like the full build validates
// pages (literal names at icon positions must resolve); a prebuilt page (the
// default 404) only needs its icons delivered.
async function updateDynamicIcons({ page, context, validate }) {
  if (!context.bundledIcons) return;
  const icons = await getJitIconContext({ context });
  if (validate) {
    validateIconNames({ config: page, icons, context });
  }
  const names = detectMissingIcons({
    page,
    bundledIcons: context.bundledIcons,
    dynamicIconData: context.dynamicIconData,
    icons,
  });
  if (names.length > 0) {
    await updateIconImportsJit({ names, icons, context });
  }
}

async function buildPageJit({ pageId, pageRegistry, context, directories, logger }) {
  // The dev server passes the context it keeps across page builds; without one,
  // a minimal context is made for this build.
  const keptContext =
    context ??
    createContext({
      directories,
      logger: logger ?? console,
      stage: 'dev',
    });
  prepareJitContext(keptContext);

  const pageEntry = type.isFunction(pageRegistry.get)
    ? pageRegistry.get(pageId)
    : pageRegistry[pageId];

  if (!pageEntry) {
    return null;
  }

  // Every step runs on this build's own context, so concurrent builds on the
  // kept context keep their errors, warnings, type counts and action
  // references apart.
  const buildContext = createPageBuildContext(keptContext);
  const buildErrors = buildContext.errors;
  const buildWarnings = buildContext.warnings;
  const mapsMark = scanJitMaps({ context: buildContext });

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

        await updateDynamicIcons({ page, context: buildContext, validate: false });
        return page;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }

    const { page: processed, refDef } = await resolvePageSource({
      pageId,
      pageEntry,
      buildContext,
    });

    // Tag all objects with ~r for ref provenance (normally done inside _ref
    // resolution by the walker; JIT resolves the page file directly).
    tagRefDeep(processed, refDef.id);

    // Add keys to the resolved page
    addKeys({ components: processed, context: buildContext });

    // Warn on unknown block keys and mistyped block fields, as the full
    // build's testSchema does. Before auth is attached: it is not page config.
    testSchema({ components: processed, context: buildContext, schema: pageSchema });

    // Apply skeleton-computed auth and path (buildAuth ran during skeleton
    // build, and buildModules scoped a module page's path to its entry).
    processed.auth = pageEntry.auth;
    processed.path = pageEntry.path;

    // Build the page (validation, block processing)
    const checkDuplicatePageId = createCheckDuplicateId({
      message: 'Duplicate pageId "{{ id }}".',
    });
    // buildPage collects the page's action references on this build's context.
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
    await updateDynamicIcons({ page: processed, context: buildContext, validate: true });

    // Validate link, state, payload, and server-state references
    const pageIds = Object.keys(pageRegistry);
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
    // Fail the build when a per-org client action is wired under the
    // "pinned" organizations policy. The dev JIT context is rebuilt from disk
    // and carries no components.auth, so the policy is read from the auth.json
    // artifact - only when a ref exists, to avoid a disk read on every build.
    if (buildContext.orgClientActionRefs.length > 0) {
      let policy = buildContext.components?.auth?.organizations?.policy;
      if (type.isUndefined(policy) && type.isString(buildContext.directories?.build)) {
        const authPath = path.join(buildContext.directories.build, 'auth.json');
        try {
          const authContent = await fs.promises.readFile(authPath, 'utf8');
          policy = serializer.deserialize(JSON.parse(authContent))?.organizations?.policy;
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
      }
      validateOrgClientActionRefs({
        orgClientActionRefs: buildContext.orgClientActionRefs,
        policy: policy ?? 'pinned',
        context: buildContext,
      });
    }
    validateDynamicBlockRefs({
      dynamicBlockRefs: buildContext.dynamicBlockRefs,
      endpointConfigs,
      context: buildContext,
    });
    validateWebsocketRefs({
      websocketActionRefs: buildContext.websocketActionRefs,
      websocketIds: buildContext.websocketIds,
      context: buildContext,
    });
    validateStateReferences({ page: processed, context: buildContext });
    validatePayloadReferences({ page: processed, context: buildContext });
    validateServerStateReferences({ page: processed, context: buildContext });

    // Collect Tailwind class candidates before _js extraction — jsMapParser
    // replaces _js source with hashes, so classes used only inside _js source
    // would otherwise never reach the Tailwind scanner.
    const tailwindContent = collectPageContent([processed]);

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
    const { tailwindChanged } = await writePageJit({
      page: finalPage,
      context: buildContext,
      tailwindContent,
    });

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
        prodError: w.prodError === true,
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
    // Also when the build failed: an error thrown after addKeys carries a JIT
    // key, and the error handler resolves it from disk.
    await writeJitMaps({ context: buildContext, since: mapsMark });
  }
}

export default buildPageJit;
