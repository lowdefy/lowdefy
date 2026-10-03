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

// Every built connection artifact, keyed by connection id. The build always writes the
// connections directory when the app declares connections; an app with none has no directory.
// Module connections are written under their module's folder (connections/<module>/<id>.json),
// so the directory is read recursively and each artifact keyed by its own connectionId.
async function readConnectionArtifacts({ buildDirectory }) {
  const directory = path.join(buildDirectory, 'connections');
  let fileNames;
  try {
    fileNames = await fs.promises.readdir(directory, { recursive: true });
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
  const artifacts = {};
  await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.json'))
      .map(async (fileName) => {
        const content = await fs.promises.readFile(path.join(directory, fileName), 'utf8');
        const artifact = JSON.parse(content);
        artifacts[artifact.connectionId] = artifact;
      })
  );
  return artifacts;
}

export default readConnectionArtifacts;
