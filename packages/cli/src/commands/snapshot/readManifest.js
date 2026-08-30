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
import YAML from 'yaml';
import { validate } from '@lowdefy/ajv';

import manifestSchema from './manifestSchema.js';

const MANIFEST_PATH = path.join('tests', 'snapshots.yaml');

// readManifest returns the parsed tests/snapshots.yaml, or undefined when the
// app has none (then every routed page is captured for every dev user). A
// manifest that exists but is malformed is an error: silently capturing the
// wrong set is worse than stopping.
function readManifest({ configDirectory }) {
  const filePath = path.join(configDirectory, MANIFEST_PATH);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  let manifest;
  try {
    manifest = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid YAML in ${MANIFEST_PATH}: ${error.message}`);
  }
  try {
    validate({ schema: manifestSchema, data: manifest });
  } catch (error) {
    throw new Error(`Invalid ${MANIFEST_PATH}: ${error.message}`);
  }
  return manifest;
}

export { MANIFEST_PATH };
export default readManifest;
