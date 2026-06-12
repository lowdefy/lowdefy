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

import { get, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import { markDeep } from './mark.js';

// Per-ref operation order is an invariant (design D3, walker steps 11-16):
// produce content → transformer → pluck key → propagate ~ignoreBuildChecks.
// (Module menu-id scoping joins at S1 with module ref compilation.)
// Failed refs collect a ConfigError and resolve to null — walker parity.

function collectOrThrow(scope, error) {
  if (scope.onError) {
    scope.onError(error);
    return null;
  }
  throw error;
}

// The walker continues tree paths through ref boundaries — reffed content is
// rooted at the global path of the ref site.
function globalSitePath(scope, sitePath) {
  if (!scope.walkPath) {
    return sitePath;
  }
  return sitePath ? `${scope.walkPath}.${sitePath}` : scope.walkPath;
}

// Instance ref ids match the walker: the global tree path of the ref site,
// falling back to the build's id counter on collision — allocation and refMap
// registration are injected by the build through scope.refTracker. Without a
// tracker (errors/keys modes, unit harnesses) there is no instance id.
function allocRefId({ scope, globalPath, refLine, file }) {
  if (!scope.refTracker) {
    return null;
  }
  const refId = scope.refTracker.alloc(globalPath, {
    parent: scope.refId ?? null,
    lineNumber: refLine,
  });
  scope.refTracker.setPath(refId, file);
  return refId;
}

async function applyRefSteps({
  scope,
  factory,
  file,
  vars,
  key,
  transformer,
  transformerPath,
  ignoreBuildChecks,
  sitePath,
  refLine,
  loc,
}) {
  const globalPath = globalSitePath(scope, sitePath);
  const refId = allocRefId({ scope, globalPath, refLine, file });
  if (scope.refChain.includes(file)) {
    throw new ConfigError(
      `Circular reference detected: ${[...scope.refChain, file].join(' -> ')}.`,
      { filePath: loc?.file, lineNumber: loc?.line }
    );
  }
  const childScope = {
    ...scope,
    vars: vars ?? {},
    file,
    callSite: loc ?? null,
    refId,
    walkPath: globalPath ?? '',
    // The ref that supplied the vars — _var injections re-tag provenance
    // with it (walker cloneVarValue parity).
    sourceRefId: scope.refId ?? null,
    refChain: [...scope.refChain, file],
  };

  let content = await factory(childScope);

  if (transformer) {
    try {
      content = transformer(content, vars ?? {});
    } catch (error) {
      throw new ConfigError(`Error calling transformer "${transformerPath}" from "${file}".`, {
        cause: error,
        filePath: loc?.file,
        lineNumber: loc?.line,
      });
    }
  }

  if (key !== null && key !== undefined) {
    content = get(content, key, { default: null });
  }

  // Walker step 15: tag the resolved content with the instance ref id. This
  // is where reffed nodes get their ~r (construction marks carry ~l only) —
  // var-substituted and nested-ref subtrees already carry theirs and
  // short-circuit, exactly like tagRefDeep.
  if (refId !== null) {
    markDeep(content, refId);
  }

  if (ignoreBuildChecks !== undefined) {
    if (type.isObject(content)) {
      content['~ignoreBuildChecks'] = ignoreBuildChecks;
    } else if (type.isArray(content)) {
      content.forEach((item) => {
        if (type.isObject(item)) {
          item['~ignoreBuildChecks'] = ignoreBuildChecks;
        }
      });
    }
  }

  return content;
}

async function ref(args) {
  try {
    return await applyRefSteps(args);
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(args.scope, error);
    }
    throw error;
  }
}

async function dynRef({ scope, path, loc, ...rest }) {
  try {
    if (!type.isString(path)) {
      throw new ConfigError(
        `_ref path resolved to a non-string value. Received: ${JSON.stringify(path)}.`,
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    if (!scope.importer) {
      throw new ConfigError(
        'Dynamic _ref paths require a scope importer (createScope({ importer })).',
        { filePath: loc?.file, lineNumber: loc?.line }
      );
    }
    const module = await scope.importer(path);
    return await applyRefSteps({ scope, factory: module.default, file: path, loc, ...rest });
  } catch (error) {
    if (error instanceof ConfigError) {
      return collectOrThrow(scope, error);
    }
    throw error;
  }
}

// Walker getConfigFile parity for statically known missing files — the
// refMap entry is still registered (the walker creates it before fetching).
async function missingRef({ scope, path, sitePath, refLine, loc }) {
  allocRefId({ scope, globalPath: globalSitePath(scope, sitePath), refLine, file: path });
  const error = new ConfigError(`Referenced file does not exist: "${path}".`, {
    filePath: loc?.file,
    lineNumber: loc?.line,
  });
  return collectOrThrow(scope, error);
}

export { ref, dynRef, missingRef };
