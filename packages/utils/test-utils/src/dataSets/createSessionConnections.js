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

import createGatedResolver from './createGatedResolver.js';
import createRefusingResolver from './createRefusingResolver.js';
import createStubResolver from './createStubResolver.js';
import sinkExternalConnections from './sinkExternalConnections.js';

const DECLARED_MODES = new Set(['external', 'redirect', 'walled']);

// The connection plugin maps of one call under a data session, built from the app's real map and
// the session's stubs and gates. Every host calls it: the build host's call context and the dev
// server's request context, so a stub or a gate behaves the same on each.
// - `resolvers` is context.connections. sinkExternalConnections has replaced the request
//   resolvers that reach an outside service. A stubbed request type answers from the first stub
//   that matches, and falls through to that resolver when none does. Every resolver can be held
//   at a pause gate and failed at a fail gate.
// - `gate` is the map applyDataSetRedirect reads each connection type's meta.dataSet from.
//
// The session adds no rule of its own to what a type declares, with one exception, which is
// what a stub is for: a type that declares nothing is refused by the gate, and stubbing one of
// its request types lets its connections through, as an external type's are. Only the stubbed
// request types then run, and a request no stub matches is sunk; every other request type of
// that type refuses.
function createSessionConnections({ connections, context, session }) {
  const sunk = sinkExternalConnections({ context, connections, session });
  const gate = {};
  const resolvers = {};
  Object.entries(sunk).forEach(([connectionType, definition]) => {
    gate[connectionType] = definition;
    resolvers[connectionType] = definition;
    if (!type.isObject(definition?.requests)) return;
    const stubbed = new Set(
      session.stubs
        .filter((stub) => stub.connectionType === connectionType)
        .map((stub) => stub.requestType)
    );
    const opened = stubbed.size > 0 && !DECLARED_MODES.has(definition.meta?.dataSet);
    let fallbacks = definition.requests;
    if (opened) {
      const external = { ...definition, meta: { ...definition.meta, dataSet: 'external' } };
      gate[connectionType] = external;
      fallbacks = sinkExternalConnections({
        context,
        connections: { [connectionType]: external },
        session,
      })[connectionType].requests;
    }
    const requests = {};
    Object.entries(definition.requests).forEach(([requestType, resolver]) => {
      let sessionResolver = resolver;
      if (stubbed.has(requestType)) {
        sessionResolver = createStubResolver({
          connectionType,
          context,
          fallback: fallbacks[requestType],
          requestType,
          session,
        });
      } else if (opened) {
        sessionResolver = createRefusingResolver({ connectionType, requestType, session });
      }
      if (sessionResolver !== resolver) {
        // The schema and meta stay the real resolver's, so the request is validated,
        // read-checked and write-checked as for real, whatever answers in its place.
        Object.assign(sessionResolver, { meta: resolver.meta, schema: resolver.schema });
      }
      requests[requestType] = createGatedResolver({ resolver: sessionResolver, session });
    });
    resolvers[connectionType] = { ...definition, requests };
  });
  return { gate, resolvers };
}

export default createSessionConnections;
