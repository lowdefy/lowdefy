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

// The loopback hosts the dev server's own mail capture listens on (LOWDEFY_DEV_SMTP_PORT).
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

// An SMTP request whose connection points at the dev server's mail capture is the one request of
// an external type that is safe to run for real under a data session: nothing leaves the machine,
// and the journey's `email` step reads what it captures.
function isDevMailCapture({ connectionType, connection }) {
  const port = process.env.LOWDEFY_DEV_SMTP_PORT;
  if (connectionType !== 'SMTP' || type.isNone(port)) return false;
  return LOOPBACK_HOSTS.has(connection?.host) && String(connection?.port) === String(port);
}

// What a sunk request carries: where it was aimed and what it asked for, never the connection's
// properties, which hold its credentials. Request properties are evaluated app config and
// payload; secrets are scrubbed.
function describeSunkRequest({ context, args, connectionType }) {
  const scrub = context.scrubSecrets ?? ((value) => value);
  return {
    connectionId: args.connectionId,
    connectionType,
    requestId: args.requestId,
    pageId: args.pageId ?? null,
    endpointId: args.endpointId ?? null,
    request: type.isUndefined(args.request) ? null : JSON.parse(scrub(JSON.stringify(args.request))),
  };
}

// The plugin connection map for a data session's requests. A connection type that declares
// meta.dataSet 'external' reaches an outside service and keeps its real target, so under a data
// session every one of its request resolvers is replaced by a sink: the request is recorded on
// the session (session.sunk) and answers null, and nothing reaches the service. This is the one
// place real mail and HTTP are stopped, in the process that would send them, so a branch a click
// never takes, or an id an operator computes, cannot reach out either. It leaves the resolver's
// schema and meta in place, so the request is still validated, read-checked and write-checked
// as for real. Types with no request resolvers (an Mcp config container) have nothing to sink
// and stay refused by the click rails. Returns a new map; the plugin map is never mutated.
function sinkExternalConnections({ context, connections, session }) {
  const sunk = {};
  Object.entries(connections).forEach(([connectionType, definition]) => {
    const requests = definition?.requests;
    if (definition?.meta?.dataSet !== 'external' || !type.isObject(requests)) {
      sunk[connectionType] = definition;
      return;
    }
    const sunkRequests = {};
    Object.entries(requests).forEach(([requestType, resolver]) => {
      const sink = async (args) => {
        if (isDevMailCapture({ connectionType, connection: args.connection })) {
          return resolver(args);
        }
        session.sunk.push({
          ...describeSunkRequest({ context, args, connectionType }),
          requestType,
        });
        return null;
      };
      sunkRequests[requestType] = Object.assign(sink, resolver);
    });
    sunk[connectionType] = { ...definition, requests: sunkRequests };
  });
  return sunk;
}

export default sinkExternalConnections;
