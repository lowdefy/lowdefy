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

import addKeys from '../addKeys.js';
import buildApi from '../buildApi/buildApi.js';
import validateApiHtmlLinks from '../buildApi/validateApiHtmlLinks.js';
import collectIconNames from '../buildImports/collectIconNames.js';
import jsMapParser from '../buildJs/jsMapParser.js';
import { tagRefDeep } from '../buildRefs/walker.js';
import resolveIconName from '../icons/resolveIconName.js';
import clearRuleTargetNodes from '../pluginChecks/clearRuleTargetNodes.js';
import runPluginChecks from '../runPluginChecks.js';
import testSchema from '../testSchema.js';
import validateCallAgentSteps from '../validateCallAgentSteps.js';
import validateModuleSecrets from '../validateModuleSecrets.js';
import validateRenderNotificationSteps from '../validateRenderNotificationSteps.js';
import lowdefySchema from '../../lowdefySchema.js';
import createReadConfigFile from '../../utils/readConfigFile.js';
import createWriteBuildArtifact from '../../utils/writeBuildArtifact.js';
import makeId from '../../utils/makeId.js';
import tryBuildStep from '../../utils/tryBuildStep.js';
import createFindEndpointOfKey from './createFindEndpointOfKey.js';
import createJitMaps from './createJitMaps.js';
import createPageBuildContext from './createPageBuildContext.js';
import listSkeletonSourceFiles from './listSkeletonSourceFiles.js';
import listWarning from './listWarning.js';
import normalizeRefPath from './normalizeRefPath.js';
import resolveSourceFile from './resolveSourceFile.js';

// One object, so the compiled validator is reused across builds.
const endpointSchema = { definitions: lowdefySchema.definitions, $ref: '#/definitions/endpoint' };

// What the rest of the config reads from an endpoint: MCP tools, agent tools
// and hooks, auth hooks, the page CallAPI checks, link routes, cron schedules
// and the webhook auth check. The config build wrote what it derived from
// these, so an endpoint rebuilt alone must keep them.
const sharedFields = ['type', 'link', 'webhook', 'description', 'payloadSchema', 'schedules'];

class Fallback extends Error {}

function fallBack(reason) {
  throw new Fallback(reason);
}

function readArtifact({ directories, name }) {
  return serializer.deserialize(
    JSON.parse(fs.readFileSync(path.join(directories.build, name), 'utf8'))
  );
}

// The types an endpoint's build counted that the config build counted nowhere:
// types.json and the plugin imports would gain them.
function findNewTypes({ counters, keptCounters, prefix = '' }) {
  const newTypes = [];
  for (const [name, counter] of Object.entries(counters)) {
    if (type.isFunction(counter.getCounts)) {
      for (const typeName of Object.keys(counter.getCounts())) {
        if (keptCounters?.[name]?.getCount(typeName) > 0) continue;
        newTypes.push(`${prefix}${name} "${typeName}"`);
      }
      continue;
    }
    newTypes.push(
      ...findNewTypes({ counters: counter, keptCounters: keptCounters?.[name], prefix: `${name} ` })
    );
  }
  return newTypes;
}

function idsInCounterRange({ prefix, from, to }) {
  const ids = [];
  for (let counter = from + 1; counter <= to; counter += 1) {
    ids.push(`${prefix}${counter.toString(36)}`);
  }
  return ids;
}

function pickEntries({ map, ids }) {
  const entries = {};
  for (const id of ids) {
    if (!type.isUndefined(map[id])) {
      entries[id] = map[id];
    }
  }
  return entries;
}

// The endpoints that read a source file: all of them are rebuilt with it.
function groupBySource({ endpointIds, endpointRegistry }) {
  const groups = new Map();
  for (const endpointId of endpointIds) {
    const entry = endpointRegistry.endpoints.get(endpointId);
    if (type.isNone(entry?.source)) {
      fallBack(`endpoint "${endpointId}" has no source file of its own`);
    }
    if (groups.has(entry.source.refId)) continue;
    groups.set(entry.source.refId, {
      source: entry.source,
      endpointIds: [...endpointRegistry.endpoints.values()]
        .filter((other) => other.source?.refId === entry.source.refId)
        .map((other) => other.endpointId),
    });
  }
  return [...groups.values()];
}

async function resolveGroup({ group, buildContext }) {
  const from = makeId.counter;
  const { content, moduleEntry, refDef } = await resolveSourceFile({
    entry: group.source,
    buildContext,
    label: `Endpoint source "${group.source.refPath}"`,
  });
  const items = type.isArray(content) ? content : [content];
  const endpoints = items.filter((item) => type.isObject(item));
  for (const endpoint of endpoints) {
    if (moduleEntry) {
      validateModuleSecrets({
        content: endpoint,
        manifest: moduleEntry.manifest,
        entryId: moduleEntry.id,
      });
      endpoint.id = `${moduleEntry.id}/${endpoint.id}`;
    }
    tagRefDeep(endpoint, refDef.id);
  }
  const ids = endpoints.map((endpoint) => endpoint.id);
  // In the same order too: the order keys each endpoint and lists link routes
  // and cron schedules.
  if (
    endpoints.length !== items.length ||
    ids.length !== group.endpointIds.length ||
    !group.endpointIds.every((endpointId, index) => ids[index] === endpointId)
  ) {
    fallBack(`the endpoints "${group.source.refPath}" holds changed`);
  }
  // Every ref the source's resolve made: the files these endpoints read now.
  const files = new Set();
  for (const refId of idsInCounterRange({ prefix: makeId.prefix, from, to: makeId.counter })) {
    const refPath = buildContext.refMap[refId]?.path;
    if (type.isString(refPath)) {
      files.add(normalizeRefPath(refPath));
    }
  }
  return { endpoints, files };
}

function keyEndpoint({ endpoint, endpointRegistry, buildContext }) {
  addKeys({
    components: endpoint,
    context: buildContext,
    parent: {
      keyMapId: endpointRegistry.apiKey,
      segment: endpointRegistry.endpoints.get(endpoint.endpointId ?? endpoint.id).segment,
      ref: endpointRegistry.apiRef,
    },
  });
}

function checkSharedFields({ endpoint, previous }) {
  for (const field of sharedFields) {
    if (JSON.stringify(endpoint[field]) !== JSON.stringify(previous[field])) {
      fallBack(`the ${field} of endpoint "${endpoint.endpointId}" changed`);
    }
  }
}

function checkJsMap({ buildContext, keptContext }) {
  for (const env of ['client', 'server']) {
    for (const hash of Object.keys(buildContext.jsMap[env])) {
      if (type.isUndefined(keptContext.jsMap[env]?.[hash])) {
        fallBack('a _js function changed');
      }
    }
  }
}

function checkIcons({ endpoints, buildContext, directories }) {
  const bundled = new Set(readArtifact({ directories, name: 'iconImports.json' }));
  const texts = [JSON.stringify(endpoints), ...Object.values(buildContext.jsMap.server)];
  for (const text of texts) {
    for (const name of collectIconNames({ text })) {
      if (bundled.has(name)) continue;
      if (resolveIconName({ name, ...buildContext.icons }) !== null) {
        fallBack(`icon "${name}" is new`);
      }
    }
  }
}

// An unset variable's warning lists every place the config build read it,
// so it changes with an endpoint's reads.
function checkEnvWarnings({ endpointRegistry, files }) {
  for (const { warning } of endpointRegistry.warnings.other) {
    if (warning.checkSlug !== 'secrets' || !warning.message.startsWith('Environment variable "')) {
      continue;
    }
    for (const file of files) {
      if (warning.message.includes(file) || (warning.source ?? '').includes(file)) {
        fallBack('an unset environment variable warning lists one of its files');
      }
    }
  }
}

function previousFiles({ endpointIds, endpointRegistry }) {
  const files = new Set();
  for (const endpointId of endpointIds) {
    for (const file of endpointRegistry.endpoints.get(endpointId).files) {
      files.add(file);
    }
  }
  return files;
}

// The warnings the build status lists after the rebuild: the config build's,
// with the rebuilt endpoints' replaced by what their builds found, each listed
// once per listing key as handleWarning lists them.
function mergeWarnings({ endpointRegistry }) {
  const listed = new Set();
  const warnings = [];
  const lists = [endpointRegistry.warnings.other, ...endpointRegistry.warnings.byEndpoint.values()];
  for (const list of lists) {
    for (const { listKey, warning } of list) {
      if (listed.has(listKey)) continue;
      listed.add(listKey);
      warnings.push(warning);
    }
  }
  return warnings;
}

const undefinedTypePattern = /^\w+ type "([^"]+)" was used but is not defined/;

// buildTypes warns about a type the app uses and no plugin defines at the
// first place the config build counted it, which can be another endpoint's.
function checkUndefinedTypes({ endpointRegistry, endpointIds, counters }) {
  const undefinedTypes = new Set();
  const lists = [endpointRegistry.warnings.other, ...endpointRegistry.warnings.byEndpoint.values()];
  for (const list of lists) {
    for (const { warning } of list) {
      const match = undefinedTypePattern.exec(warning.message);
      if (match) undefinedTypes.add(match[1]);
    }
  }
  if (undefinedTypes.size === 0) return;
  for (const endpointId of endpointIds) {
    for (const { warning } of endpointRegistry.warnings.byEndpoint.get(endpointId) ?? []) {
      if (undefinedTypePattern.test(warning.message)) {
        fallBack(`the config build warned about an undefined type in endpoint "${endpointId}"`);
      }
    }
  }
  for (const typeName of listCountedTypes(counters)) {
    if (undefinedTypes.has(typeName)) {
      fallBack(`it uses "${typeName}", which no plugin defines`);
    }
  }
}

function listCountedTypes(counters) {
  const typeNames = [];
  for (const counter of Object.values(counters)) {
    if (type.isFunction(counter.getCounts)) {
      typeNames.push(...Object.keys(counter.getCounts()));
      continue;
    }
    typeNames.push(...listCountedTypes(counter));
  }
  return typeNames;
}

// Rebuilds and rewrites the endpoints a set of edited files feed, without the
// config build the dev server otherwise runs: each endpoint's source file is
// resolved again (resolveSourceFile, as page builds resolve pages) and runs
// the steps the config build runs on endpoints, on a context made from the
// kept config build's (context, the manager's last shallowBuild result).
//
// The result is { fallback: reason } when the edit could reach past these
// endpoints' artifacts, and the config must be built instead: a build error
// (the config build reports it as a full build does), endpoints added, removed
// or renamed, a field other config reads from an endpoint, a type, _js
// function or icon the config build did not bundle, an unset environment
// variable, or plugin checks waiting on an install. Otherwise it writes each
// endpoint's artifact and the key and ref map entries it made, updates
// endpointRegistry, and returns the build status warnings.
async function buildEndpointsJit({
  endpointIds,
  endpointRegistry,
  context: keptContext,
  directories,
}) {
  try {
    const groups = groupBySource({ endpointIds, endpointRegistry });
    const rebuiltIds = groups.flatMap((group) => group.endpointIds);

    // Keys and refs this build makes continue the config build's, under their
    // own prefix: the dev server's page builds key on under the same build's
    // prefix with their process id (continueJitKeys).
    makeId.continueFrom({ prefix: `${endpointRegistry.keyPrefix}e_`, counter: 0 });
    const counterStart = makeId.counter;

    const buildContext = createPageBuildContext(keptContext);
    buildContext.directories = { ...keptContext.directories, build: directories.build };
    // The kept context's read cache holds what the config build read.
    buildContext.readConfigFile = createReadConfigFile({ directories: buildContext.directories });
    buildContext.writeBuildArtifact = createWriteBuildArtifact({
      directories: buildContext.directories,
    });
    // Refs take counter ids, as in page builds, not walker paths the config
    // build's refs already hold.
    buildContext.jitMaps = createJitMaps({ keyMap: {}, refMap: {}, name: 'endpoints' });
    // The _js functions the endpoints use, checked against the config build's.
    buildContext.jsMap = { client: {}, server: {} };
    buildContext.seenSourceLines = new Set();

    const resolved = [];
    for (const group of groups) {
      resolved.push(await resolveGroup({ group, buildContext }));
    }
    if (buildContext.unsetEnvReads.size > 0) {
      fallBack('it reads an environment variable that is not set');
    }
    const endpoints = resolved.flatMap((item) => item.endpoints);
    const filesById = new Map();
    for (const { endpoints: groupEndpoints, files } of resolved) {
      for (const endpoint of groupEndpoints) {
        filesById.set(endpoint.id, files);
      }
    }
    checkEnvWarnings({
      endpointRegistry,
      files: new Set([
        ...previousFiles({ endpointIds: rebuiltIds, endpointRegistry }),
        ...resolved.flatMap((item) => [...item.files]),
      ]),
    });

    // The config build's steps, in its order, on these endpoints.
    for (const endpoint of endpoints) {
      keyEndpoint({ endpoint, endpointRegistry, buildContext });
      testSchema({ components: endpoint, context: buildContext, schema: endpointSchema });
    }
    const previous = new Map(
      endpoints.map((endpoint) => [
        endpoint.id,
        readArtifact({ directories, name: `api/${endpoint.id}.json` }),
      ])
    );
    for (const endpoint of endpoints) {
      // buildAuth decides an endpoint's auth from its id and the app's auth
      // config, neither of which an endpoint file holds.
      endpoint.auth = previous.get(endpoint.id).auth;
    }
    const components = {
      api: endpoints,
      agents: endpointRegistry.agents,
      config: { environments: endpointRegistry.environments },
      pages: endpointRegistry.pageIds.map((pageId) => ({ pageId })),
    };
    tryBuildStep(buildApi, 'buildApi', { components, context: buildContext });
    tryBuildStep(validateCallAgentSteps, 'validateCallAgentSteps', {
      components,
      context: buildContext,
    });
    tryBuildStep(validateRenderNotificationSteps, 'validateRenderNotificationSteps', {
      components,
      context: buildContext,
    });
    const { pending } = await runPluginChecks({
      components: { api: endpoints },
      context: buildContext,
      allSlugPackages: true,
    });
    clearRuleTargetNodes({ context: buildContext });
    if (pending.length > 0) {
      fallBack('plugin checks wait on a plugin install');
    }
    tryBuildStep(validateApiHtmlLinks, 'validateApiHtmlLinks', {
      components,
      context: buildContext,
    });
    const builtEndpoints = jsMapParser({
      input: endpoints,
      jsMap: buildContext.jsMap,
      env: 'server',
    });
    for (const endpoint of builtEndpoints) {
      keyEndpoint({ endpoint, endpointRegistry, buildContext });
    }

    if (buildContext.errors.length > 0) {
      fallBack('its build found errors');
    }
    for (const endpoint of builtEndpoints) {
      checkSharedFields({ endpoint, previous: previous.get(endpoint.endpointId) });
    }
    const newTypes = findNewTypes({
      counters: buildContext.typeCounters,
      keptCounters: keptContext.typeCounters,
    });
    if (newTypes.length > 0) {
      fallBack(`it uses ${newTypes[0]}, which the config build did not`);
    }
    checkUndefinedTypes({
      endpointRegistry,
      endpointIds: rebuiltIds,
      counters: buildContext.typeCounters,
    });
    checkJsMap({ buildContext, keptContext });
    checkIcons({ endpoints: builtEndpoints, buildContext, directories });

    for (const endpoint of builtEndpoints) {
      await buildContext.writeBuildArtifact(
        `api/${endpoint.endpointId}.json`,
        serializer.serializeToString(endpoint),
        // The dev server reads endpoint artifacts as requests come in.
        { atomic: true }
      );
    }
    const mapIds = idsInCounterRange({
      prefix: makeId.prefix,
      from: counterStart,
      to: makeId.counter,
    });
    endpointRegistry.builds += 1;
    // The dev server's error handler and tools read jitMaps/ with keyMap.json
    // (readMergedMaps); the dev server keeps endpoints- files until the next
    // config build publishes (pruneJitMaps).
    await buildContext.writeBuildArtifact(
      `jitMaps/endpoints-${endpointRegistry.builds}-1.json`,
      serializer.serializeToString({
        keyMap: pickEntries({ map: buildContext.keyMap, ids: mapIds }),
        refMap: pickEntries({ map: buildContext.refMap, ids: mapIds }),
      }),
      { atomic: true }
    );

    for (const endpoint of builtEndpoints) {
      const entry = endpointRegistry.endpoints.get(endpoint.endpointId);
      entry.rootKey = endpoint['~k'];
      entry.files = filesById.get(endpoint.id) ?? new Set();
      endpointRegistry.warnings.byEndpoint.set(endpoint.endpointId, []);
    }
    const findEndpointOfKey = createFindEndpointOfKey({
      endpointRegistry,
      keyMap: buildContext.keyMap,
    });
    for (const warning of buildContext.warnings) {
      // A warning about no endpoint node (two plugins sharing a check id) is
      // listed once with the rest by its listing key.
      const endpointId = findEndpointOfKey(warning.configKey) ?? rebuiltIds[0];
      endpointRegistry.warnings.byEndpoint.get(endpointId).push(listWarning(warning));
    }
    return {
      endpointIds: builtEndpoints.map((endpoint) => endpoint.endpointId),
      skeletonSourceFiles: listSkeletonSourceFiles({ endpointRegistry }),
      warnings: mergeWarnings({ endpointRegistry }),
    };
  } catch (error) {
    if (error instanceof Fallback) {
      return { fallback: error.message };
    }
    // The config build reports the error as a full build does. An error that
    // is no config error is a fault in this build, which the caller logs.
    return {
      fallback: `it failed: ${error.message}`,
      ...(error.isLowdefyError === true ? {} : { error }),
    };
  }
}

export default buildEndpointsJit;
