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
import { serializer } from '@lowdefy/helpers';

// What identifies a file's content without reading it: an atomic write
// (an endpoint rebuilt alone) gives the file a new inode, and a config build's
// write changes its mtime or size.
function readIdentity(filePath) {
  const stat = fs.statSync(filePath, { bigint: true });
  return `${stat.ino}:${stat.mtimeNs}:${stat.size}`;
}

// Recursively collect every endpoint artifact under the api directory. Module
// endpoints are written to build/api/<moduleId>/<endpointId>.json because their
// scoped endpointId contains a "/" (buildModules prefixes ids with the module entry
// id), so a flat read would miss them and flag every module CallAPI as non-existent.
function readApiConfigs({ directory, cache, seen }) {
  const configs = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      configs.push(...readApiConfigs({ directory: entryPath, cache, seen }));
      continue;
    }
    if (!entry.name.endsWith('.json')) continue;
    seen.add(entryPath);
    const identity = readIdentity(entryPath);
    const cached = cache.get(entryPath);
    if (cached?.identity === identity) {
      configs.push(cached.config);
      continue;
    }
    const config = serializer.deserialize(JSON.parse(fs.readFileSync(entryPath, 'utf8')));
    cache.set(entryPath, { identity, config });
    configs.push(config);
  }
  return configs;
}

// Read the endpoint artifacts persisted by writeApi (build/api/<endpointId>.json).
// The full build keeps endpoints in memory on components.api, but the dev context is
// rebuilt from disk, so getBuildContext hydrates them here. validateCallApiRefs needs
// each config's endpointId and type, both of which are present in the artifact.
// With a cache (a Map the caller keeps), a file is parsed again only when it
// changed since the last read: the dev server reads them again after every
// edit, since an endpoint rebuilt alone rewrites its artifact without a config
// publish.
function readBuildApiArtifacts(buildDirectory, cache = new Map()) {
  const apiDirectory = path.join(buildDirectory, 'api');
  const seen = new Set();
  let configs;
  try {
    configs = readApiConfigs({ directory: apiDirectory, cache, seen });
  } catch (error) {
    // writeApi only creates the directory when endpoints are defined — absent means none.
    if (error.code === 'ENOENT') {
      cache.clear();
      return [];
    }
    throw error;
  }
  for (const filePath of cache.keys()) {
    if (!seen.has(filePath)) {
      cache.delete(filePath);
    }
  }
  return configs;
}

export default readBuildApiArtifacts;
