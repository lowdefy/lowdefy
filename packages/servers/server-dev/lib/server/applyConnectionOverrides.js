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

import { mergeObjects, type } from '@lowdefy/helpers';

// Connection property overrides for the test runner (`lowdefy test`), parsed once
// at module load: { "<connectionId>": { "<property>": <value> } }. The runner
// points every seeded connection at an in-memory MongoDB without touching the
// app's config. This is a runner detail, never an app-visible config key.
function parseOverrides(raw) {
  if (type.isNone(raw) || raw === '') {
    return null;
  }
  const parsed = JSON.parse(raw);
  if (!type.isObject(parsed)) {
    throw new Error(
      `LOWDEFY_TEST_CONNECTION_OVERRIDES should be a JSON object keyed by connectionId. Received ${raw}.`
    );
  }
  return parsed;
}

const connectionOverrides = parseOverrides(process.env.LOWDEFY_TEST_CONNECTION_OVERRIDES);
let logged = false;

const connectionPathPattern = /^connections\/(.+)\.json$/;

// Wraps context.readConfigFile so a read of connections/<id>.json returns the
// artifact with `properties` replaced by mergeObjects([properties, override]) -
// the override wins over an operator node such as `{ _secret: MONGODB_URI }`.
// Every other path, and every read when the variable is unset, is untouched.
function applyConnectionOverrides({ context }) {
  if (type.isNone(connectionOverrides)) {
    return context;
  }
  if (!logged) {
    // A silently redirected database would be worse than the problem this solves.
    context.logger.info(
      `Connection properties overridden for test run: ${Object.keys(connectionOverrides).join(
        ', '
      )}.`
    );
    logged = true;
  }
  const readConfigFile = context.readConfigFile;
  context.readConfigFile = async function readConfigFileWithOverrides(filePath) {
    const artifact = await readConfigFile(filePath);
    const match = connectionPathPattern.exec(filePath);
    if (type.isNone(match) || type.isNone(artifact)) {
      return artifact;
    }
    const override = connectionOverrides[match[1]];
    if (type.isNone(override)) {
      return artifact;
    }
    return {
      ...artifact,
      properties: mergeObjects([artifact.properties ?? {}, override]),
    };
  };
  return context;
}

export default applyConnectionOverrides;
