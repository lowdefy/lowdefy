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

function refTargets({ connection, connections }) {
  return Object.values(connection.fields)
    .filter((field) => field.kind === 'ref' && Object.hasOwn(connections, field.connectionId))
    .map((field) => field.connectionId);
}

// The generated connections in the order they can be made: a connection whose fields ref another
// generated connection comes after it, so the ids it picks from exist. Refs that form a cycle are
// refused, naming the cycle.
function orderGenerateConnections({ connections, fail }) {
  const order = [];
  const state = new Map();
  function visit(connectionId, path) {
    if (state.get(connectionId) === 'done') return;
    if (state.get(connectionId) === 'visiting') {
      const cycle = [...path.slice(path.indexOf(connectionId)), connectionId];
      fail(`generate refs form a cycle: ${cycle.join(' -> ')}.`);
    }
    state.set(connectionId, 'visiting');
    refTargets({ connection: connections[connectionId], connections }).forEach((target) => {
      visit(target, [...path, connectionId]);
    });
    state.set(connectionId, 'done');
    order.push(connectionId);
  }
  Object.keys(connections).forEach((connectionId) => visit(connectionId, []));
  return order;
}

export default orderGenerateConnections;
