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

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PLUGIN_KIND_DIRECTORIES = ['blocks', 'operators', 'actions', 'connections'];

// Extracts the first block of the first gallery section from raw gallery.yaml text, dedented, so
// the example keeps its author's formatting without a yaml dependency.
export function trimGalleryExample(galleryYaml) {
  const lines = galleryYaml.split('\n');
  const blocksLine = lines.findIndex((line) => /^\s+blocks:\s*$/.test(line));
  if (blocksLine === -1) return null;
  const firstItem = lines.findIndex((line, i) => i > blocksLine && /^\s+- id:/.test(line));
  if (firstItem === -1) return null;
  const indent = lines[firstItem].match(/^\s*/)[0].length;
  const example = [lines[firstItem]];
  for (let i = firstItem + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') break;
    const lineIndent = line.match(/^\s*/)[0].length;
    if (lineIndent <= indent) break;
    example.push(line);
  }
  return example.map((line) => line.slice(indent)).join('\n');
}

async function importFile(filePath) {
  return import(pathToFileURL(filePath).href);
}

// Scans packages/plugins/*/*/dist/types.js and indexes every provided type by kind and name.
// A name provided by several packages is kept as a list so the manifest can disambiguate with
// "Type@package".
async function indexPlugins({ pluginsDirectory }) {
  const index = { blocks: {}, operators: {}, actions: {}, connections: {}, requests: {} };
  function add(kind, name, entry) {
    index[kind][name] = [...(index[kind][name] ?? []), entry];
  }
  for (const kindDirectory of PLUGIN_KIND_DIRECTORIES) {
    const kindPath = path.join(pluginsDirectory, kindDirectory);
    if (!fs.existsSync(kindPath)) continue;
    for (const packageDirectory of fs.readdirSync(kindPath).sort()) {
      const packagePath = path.join(kindPath, packageDirectory);
      const typesPath = path.join(packagePath, 'dist', 'types.js');
      const packageJsonPath = path.join(packagePath, 'package.json');
      if (!fs.existsSync(typesPath) || !fs.existsSync(packageJsonPath)) continue;
      const packageName = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).name;
      const types = (await importFile(typesPath)).default ?? {};
      const entry = { packageName, packagePath };
      for (const name of types.blocks ?? []) add('blocks', name, entry);
      for (const name of types.actions ?? []) add('actions', name, entry);
      for (const name of types.connections ?? []) add('connections', name, entry);
      for (const name of types.requests ?? []) add('requests', name, entry);
      const operators = types.operators ?? {};
      const operatorNames = new Set([...(operators.client ?? []), ...(operators.server ?? [])]);
      for (const name of operatorNames) {
        add('operators', name, {
          ...entry,
          runsOn: ['client', 'server'].filter((env) => (operators[env] ?? []).includes(name)),
        });
      }
    }
  }
  return index;
}

function pickProvider({ index, kind, typeName }) {
  const [name, packageName] =
    typeName.split('@@').length === 2
      ? [typeName.split('@@')[0], `@${typeName.split('@@')[1]}`]
      : [typeName, null];
  const providers = index[kind][name] ?? [];
  if (providers.length === 0) {
    return { name, provider: null, error: `no plugin package provides ${kind} type "${name}"` };
  }
  if (packageName !== null) {
    const provider = providers.find((p) => p.packageName === packageName);
    if (!provider) {
      return {
        name,
        provider: null,
        error: `"${packageName}" does not provide ${kind} type "${name}" (provided by ${providers
          .map((p) => p.packageName)
          .join(', ')})`,
      };
    }
    return { name, provider };
  }
  if (providers.length > 1) {
    return {
      name,
      provider: null,
      error: `${kind} type "${name}" is provided by several packages (${providers
        .map((p) => p.packageName)
        .join(', ')}) - write it as "${name}@${providers[0].packageName}"`,
    };
  }
  return { name, provider: providers[0] };
}

async function resolveBlock({ name, provider }) {
  const metas = await importFile(path.join(provider.packagePath, 'dist', 'metas.js'));
  const meta = metas[name];
  if (!meta) {
    return { error: `"${provider.packageName}" has no meta export for block "${name}"` };
  }
  let example = null;
  for (const baseDirectory of ['src/blocks', 'dist/blocks']) {
    const galleryPath = path.join(provider.packagePath, baseDirectory, name, 'gallery.yaml');
    if (fs.existsSync(galleryPath)) {
      example = trimGalleryExample(fs.readFileSync(galleryPath, 'utf8'));
      break;
    }
  }
  return { name, packageName: provider.packageName, meta, example };
}

async function resolveFromSchemasModule({ kind, name, provider }) {
  const schemas = await importFile(path.join(provider.packagePath, 'dist', 'schemas.js'));
  const schema = schemas[name];
  if (!schema) {
    return { error: `"${provider.packageName}" has no schema export for ${kind} "${name}"` };
  }
  return { name, packageName: provider.packageName, schema, runsOn: provider.runsOn };
}

async function resolveConnection({ name, provider }) {
  const connections = await importFile(path.join(provider.packagePath, 'dist', 'connections.js'));
  const connection = connections[name];
  if (!connection?.schema) {
    return { error: `"${provider.packageName}" has no schema for connection "${name}"` };
  }
  return {
    name,
    packageName: provider.packageName,
    schema: connection.schema,
    requests: Object.keys(connection.requests ?? {}),
  };
}

async function resolveRequest({ name, provider }) {
  const connections = await importFile(path.join(provider.packagePath, 'dist', 'connections.js'));
  for (const [connectionName, connection] of Object.entries(connections)) {
    const request = connection?.requests?.[name];
    if (request?.schema) {
      return {
        name,
        packageName: provider.packageName,
        connectionName,
        schema: request.schema,
        meta: request.meta ?? {},
      };
    }
  }
  return { error: `"${provider.packageName}" has no schema for request "${name}"` };
}

const RESOLVERS = {
  blocks: resolveBlock,
  operators: (args) => resolveFromSchemasModule({ kind: 'operators', ...args }),
  actions: (args) => resolveFromSchemasModule({ kind: 'actions', ...args }),
  connections: resolveConnection,
  requests: resolveRequest,
};

// Returns resolveType({ kind, typeName }) -> resolved item, or { error } when no plugin under
// packages/plugins provides it. Plugin dist modules are imported lazily and cached.
async function createPluginTypesResolver({ pluginsDirectory }) {
  const index = await indexPlugins({ pluginsDirectory });
  const cache = new Map();
  return async function resolveType({ kind, typeName }) {
    if (!RESOLVERS[kind]) {
      return { error: `unknown type kind "${kind}"` };
    }
    const cacheKey = `${kind}:${typeName}`;
    if (!cache.has(cacheKey)) {
      const { name, provider, error } = pickProvider({ index, kind, typeName });
      cache.set(cacheKey, error ? { error } : await RESOLVERS[kind]({ name, provider }));
    }
    return cache.get(cacheKey);
  };
}

export default createPluginTypesResolver;
