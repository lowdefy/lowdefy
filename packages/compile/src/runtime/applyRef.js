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

async function applyRefSteps({
  scope,
  factory,
  file,
  vars,
  key,
  transformer,
  transformerPath,
  ignoreBuildChecks,
  loc,
}) {
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

// Walker getConfigFile parity for statically known missing files.
async function missingRef({ scope, path, loc }) {
  const error = new ConfigError(`Referenced file does not exist: "${path}".`, {
    filePath: loc?.file,
    lineNumber: loc?.line,
  });
  return collectOrThrow(scope, error);
}

export { ref, dynRef, missingRef };
