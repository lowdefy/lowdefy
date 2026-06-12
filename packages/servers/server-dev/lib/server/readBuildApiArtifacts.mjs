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

// Recursively collect every endpoint artifact under the api directory. Module
// endpoints are written to build/api/<moduleId>/<endpointId>.json because their
// scoped endpointId contains a "/" (buildModules prefixes ids with the module entry
// id), so a flat read would miss them and flag every module CallAPI as non-existent.
function readApiConfigs(directory) {
  const configs = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      configs.push(...readApiConfigs(entryPath));
    } else if (entry.name.endsWith('.json')) {
      configs.push(serializer.deserialize(JSON.parse(fs.readFileSync(entryPath, 'utf8'))));
    }
  }
  return configs;
}

// Read the endpoint artifacts persisted by writeApi (build/api/<endpointId>.json).
// The full build keeps endpoints in memory on components.api, but the dev context is
// rebuilt from disk, so getBuildContext hydrates them here. validateCallApiRefs needs
// each config's endpointId and type, both of which are present in the artifact.
function readBuildApiArtifacts(buildDirectory) {
  const apiDirectory = path.join(buildDirectory, 'api');
  try {
    return readApiConfigs(apiDirectory);
  } catch (error) {
    // writeApi only creates the directory when endpoints are defined — absent means none.
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export default readBuildApiArtifacts;
