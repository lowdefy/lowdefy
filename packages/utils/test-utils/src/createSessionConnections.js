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

import createRefusingResolver from './createRefusingResolver.js';
import createStubResolver from './createStubResolver.js';
import holdAtStep from './holdAtStep.js';
import { sinkExternalConnections } from './dataSets/index.js';

const DECLARED_MODES = new Set(['external', 'redirect', 'walled']);

// The connection plugin maps of one call under a session, built from the app's real map:
// - `resolvers` is context.connections. sinkExternalConnections has replaced the request
//   resolvers that reach an outside service, as under a journey. A stubbed request type
//   answers from its stub. Every resolver can be held at a pause gate.
// - `gate` is the map applyDataSetRedirect reads each connection type's meta.dataSet from.
//
// The harness adds no rule of its own to what a type declares, with one exception, which is
// what a stub is for: a type that declares nothing is refused by the gate, and stubbing one of
// its request types lets its connections through, as an external type's are. Only the stubbed
// request types then run; every other request type of that type refuses.
function createSessionConnections({ context, testSession }) {
  const { connections } = testSession.runtime;
  const { session } = testSession.dataSession;
  const sunk = sinkExternalConnections({ context, connections, session });
  const gate = {};
  const resolvers = {};
  Object.entries(sunk).forEach(([connectionType, definition]) => {
    gate[connectionType] = definition;
    resolvers[connectionType] = definition;
    if (!type.isObject(definition?.requests)) return;
    const stubs = testSession.stubs.get(connectionType) ?? new Map();
    const opened = stubs.size > 0 && !DECLARED_MODES.has(definition.meta?.dataSet);
    if (opened) {
      gate[connectionType] = { ...definition, meta: { ...definition.meta, dataSet: 'external' } };
    }
    const requests = {};
    Object.entries(definition.requests).forEach(([requestType, resolver]) => {
      let sessionResolver = resolver;
      if (stubs.has(requestType)) {
        sessionResolver = createStubResolver({
          connectionType,
          context,
          requestType,
          stub: stubs.get(requestType),
          testSession,
        });
      } else if (opened) {
        sessionResolver = createRefusingResolver({ connectionType, requestType, testSession });
      }
      if (sessionResolver !== resolver) {
        // The schema and meta stay the real resolver's, so the request is validated,
        // read-checked and write-checked as for real, whatever answers in its place.
        Object.assign(sessionResolver, { meta: resolver.meta, schema: resolver.schema });
      }
      requests[requestType] = holdAtStep({ resolver: sessionResolver, testSession });
    });
    resolvers[connectionType] = { ...definition, requests };
  });
  return { gate, resolvers };
}

export default createSessionConnections;
