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

import { get, type } from '@lowdefy/helpers';

// An OTLP endpoint is authenticated by header, so the header value is a secret
// and the build never resolves it - `logger.otlp.headers` reaches the server
// with the authored `{ _secret: NAME }` node intact. The logger is created
// before any request context exists, so this is the one place that resolution
// can happen: at boot, against the process secrets.
//
// Only _secret is supported. Anything else is a config mistake worth failing
// the boot on: a request-scoped operator has nothing to read here, and a header
// silently exported as "[object Object]" would look like an auth failure at the
// log vendor.
function resolveOtlpHeaders({ headers = {}, secrets = {} }) {
  const resolved = {};
  Object.keys(headers).forEach((name) => {
    const value = headers[name];
    if (type.isString(value)) {
      resolved[name] = value;
      return;
    }
    if (!type.isObject(value) || !type.isString(value._secret)) {
      throw new Error(
        `App "logger.otlp.headers.${name}" should be a string or a "_secret" operator. Received ${JSON.stringify(
          value
        )}.`
      );
    }
    const secret = get(secrets, value._secret);
    if (!type.isString(secret)) {
      throw new Error(
        `App "logger.otlp.headers.${name}" reads secret "${value._secret}", which is not set.`
      );
    }
    resolved[name] = secret;
  });
  return resolved;
}

export default resolveOtlpHeaders;
