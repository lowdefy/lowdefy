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

import { type } from '@lowdefy/helpers';

import readBuildArtifact from '../readBuildArtifact.js';

// A read token that is also a write credential is not a read token. The two
// ways an app's ingest credential is present in a dev process are a
// LOWDEFY_SECRET_* variable (what `_secret` reads, including the OTLP
// Authorization header) and a header written inline in lowdefy.yaml. Compare
// values, not names: an operator who pastes the ingest token into
// LOWDEFY_OPS_READ_TOKEN renames nothing.
//
// Returns the name of the colliding credential, or null.
function findOpsTokenCollision({ token }) {
  const secretKey = Object.keys(process.env).find(
    (key) => key.startsWith('LOWDEFY_SECRET_') && process.env[key] === token
  );
  if (!type.isNone(secretKey)) {
    return secretKey;
  }
  const headers = readBuildArtifact({ name: 'logger.json', deserialize: true })?.otlp?.headers;
  if (!type.isObject(headers)) {
    return null;
  }
  const headerName = Object.keys(headers).find((name) => headers[name] === token);
  if (type.isNone(headerName)) {
    return null;
  }
  return `logger.otlp.headers.${headerName}`;
}

export default findOpsTokenCollision;
