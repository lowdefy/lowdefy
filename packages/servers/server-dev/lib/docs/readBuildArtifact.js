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

import path from 'node:path';
import { createArtifactReader } from '@lowdefy/node-utils';

// One reader per build directory and form (raw or deserialized), kept for the life of the process.
const readers = new Map();

// A build artifact by its path in the dev build ("pages/home.json"): the parsed JSON, deserialized
// with the serializer when deserialize is true, or null when the build has none. The dev build
// rewrites artifacts on config change and builds pages on demand, and the docs routes and headless
// journeys must read the current state: the reader parses a file again once its stat changes
// (createArtifactReader in @lowdefy/node-utils), so no build step has to invalidate it. Values are
// shared by every caller and frozen: a caller must not change one.
function readBuildArtifact({ name, deserialize = false }) {
  const buildDirectory = path.join(process.cwd(), 'build');
  const key = `${deserialize ? 'deserialized' : 'raw'}:${buildDirectory}`;
  if (!readers.has(key)) {
    readers.set(key, createArtifactReader({ buildDirectory, deserialize }));
  }
  return readers.get(key)(name);
}

export default readBuildArtifact;
