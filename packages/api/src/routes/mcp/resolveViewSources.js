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

import { ConfigError } from '@lowdefy/errors';
import { cleanBuildArtifact, isViewSourceOrigin, type } from '@lowdefy/helpers';
import { ServerParser } from '@lowdefy/operators';
import { _secret } from '@lowdefy/operators-js/operators/server';

// A build's sources array is read once per process and resolves the same way
// every time, so the answer is kept against the array itself.
const resolved = new WeakMap();

// The other origins a view page loads from or calls (mcp.viewSources), as
// strings. The build resolved _build operators; a _secret is opaque to it and
// is resolved here, on the server. A source that does not resolve to a string
// is a config fault: the host blocks every origin a view does not declare, so
// leaving one out would break the page with nothing to explain why. So is a
// string that is not exactly one https or wss origin: it would widen the
// policy the host builds from the list.
function resolveViewSources({ secrets, sources }) {
  if (resolved.has(sources)) {
    return resolved.get(sources);
  }
  const operatorsParser = new ServerParser({ operators: { _secret }, secrets, user: {} });
  const { output, errors } = operatorsParser.parse({
    input: sources,
    location: 'mcp.viewSources',
    payload: {},
  });
  if (errors.length > 0) {
    throw errors[0];
  }
  const viewSources = cleanBuildArtifact(output);
  viewSources.forEach((source, index) => {
    if (!type.isString(source) || source === '') {
      throw new ConfigError(
        `MCP viewSources entry ${index} did not resolve to a string. Check the _secret operator reference and that the secret is set.`,
        { received: type.typeOf(source) }
      );
    }
    // The value goes into the view's content security policy as it is. It may
    // have come from a secret, so the message does not repeat it.
    if (!isViewSourceOrigin(source)) {
      throw new ConfigError(
        `MCP viewSources entry ${index} is not an origin. An entry is one https or wss origin with no path, such as "https://files.example.com".`
      );
    }
  });
  resolved.set(sources, viewSources);
  return viewSources;
}

export default resolveViewSources;
