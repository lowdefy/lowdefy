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
import { serializer } from '@lowdefy/helpers';

// Read fresh on every call — the dev build rewrites artifacts on config
// change and the docs routes must serve the current state.
function readBuildArtifact({ name, deserialize = false }) {
  const filePath = path.join(process.cwd(), 'build', name);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (deserialize) {
    return serializer.deserialize(raw);
  }
  return raw;
}

export default readBuildArtifact;
