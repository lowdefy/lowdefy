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

// Where each kind of rule runs: the type counter that recorded the nodes, and
// the types map section naming the package behind each type. Operator rules
// run on client and server operator nodes, each side gated by its own section,
// so a package overriding a type on one side only takes that side's nodes.
function collectRuleTargets({ context }) {
  const { typeCounters, typesMap } = context;
  const sources = [
    { kind: 'blocks', counter: typeCounters.blocks, definitions: typesMap.blocks },
    { kind: 'actions', counter: typeCounters.actions, definitions: typesMap.actions },
    { kind: 'requests', counter: typeCounters.requests, definitions: typesMap.requests },
    { kind: 'connections', counter: typeCounters.connections, definitions: typesMap.connections },
    {
      kind: 'operators',
      counter: typeCounters.operators.client,
      definitions: typesMap.operators.client,
    },
    {
      kind: 'operators',
      counter: typeCounters.operators.server,
      definitions: typesMap.operators.server,
    },
  ];
  const targets = [];
  for (const { kind, counter, definitions } of sources) {
    for (const [typeName, nodes] of counter.getNodeEntries()) {
      const definition = definitions?.[typeName];
      // An undefined type has no package to ask; buildTypes reports it.
      if (!definition) continue;
      targets.push({
        kind,
        typeName,
        originalTypeName: definition.originalTypeName ?? typeName,
        packageName: definition.package,
        nodes,
      });
    }
  }
  return targets;
}

export default collectRuleTargets;
