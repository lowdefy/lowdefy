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

// The process group leaders the hub started. A hub that restarts adopts them, so a server
// under one of them is the hub's, even while no hub process is its ancestor.
function readHubManagedPids({ registryPath }) {
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return new Set(Object.values(registry.instances ?? {}).map((instance) => instance.pid));
  } catch {
    return new Set();
  }
}

export default readHubManagedPids;
