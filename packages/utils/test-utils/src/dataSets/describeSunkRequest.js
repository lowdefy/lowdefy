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

// What the session records of a request it sinks or stubs: where it was aimed and what it asked
// for, never the connection's properties, which hold its credentials. Request properties are
// evaluated app config and payload; secrets are scrubbed.
function describeSunkRequest({ args, connectionType, context, requestType }) {
  const scrub = context.scrubSecrets ?? ((value) => value);
  return {
    connectionId: args.connectionId,
    connectionType,
    requestId: args.requestId,
    pageId: args.pageId ?? null,
    endpointId: args.endpointId ?? null,
    request: type.isUndefined(args.request)
      ? null
      : JSON.parse(scrub(JSON.stringify(args.request))),
    requestType,
  };
}

export default describeSunkRequest;
