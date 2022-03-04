/*
  Copyright 2020-2021 Lowdefy, Inc

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

function buildTypeClass(
  context,
  { counter, definitions, store, typeClass, warnIfMissing = false }
) {
  const counts = counter.getCounts();
  Object.keys(counts).forEach((typeName) => {
    if (!definitions[typeName]) {
      if (warnIfMissing) {
        context.logger.warn(`${typeClass} type "${typeName}" was used but is not defined.`);
        return;
      }
      throw new Error(`${typeClass} type "${typeName}" was used but is not defined.`);
    }
    store[typeName] = {
      package: definitions[typeName].package,
      version: definitions[typeName].version,
      count: counts[typeName],
    };
  });
}

function buildTypes({ components, context }) {
  const { typeCounters } = context;

  // Add Mandatory Types
  // Add operators used by form validation
  typeCounters.operators.client.increment('_not');
  typeCounters.operators.client.increment('_type');
  // Add loaders and skeletons
  typeCounters.blocks.increment('IconSpinner');
  typeCounters.blocks.increment('ProgressBar');
  typeCounters.blocks.increment('Skeleton');
  typeCounters.blocks.increment('SkeletonAvatar');
  typeCounters.blocks.increment('SkeletonButton');
  typeCounters.blocks.increment('SkeletonInput');
  typeCounters.blocks.increment('SkeletonParagraph');
  typeCounters.blocks.increment('Spinner');

  components.types = {
    actions: {},
    blocks: {},
    connections: {},
    requests: {},
    operators: {
      client: {},
      server: {},
    },
  };

  buildTypeClass(context, {
    counter: typeCounters.actions,
    definitions: context.typesMap.actions,
    store: components.types.actions,
    typeClass: 'Action',
  });

  buildTypeClass(context, {
    counter: typeCounters.blocks,
    definitions: context.typesMap.blocks,
    store: components.types.blocks,
    typeClass: 'Block',
  });

  buildTypeClass(context, {
    counter: typeCounters.connections,
    definitions: context.typesMap.connections,
    store: components.types.connections,
    typeClass: 'Connection',
  });

  buildTypeClass(context, {
    counter: typeCounters.requests,
    definitions: context.typesMap.requests,
    store: components.types.requests,
    typeClass: 'Request',
  });

  buildTypeClass(context, {
    counter: typeCounters.operators.client,
    definitions: context.typesMap.operators.client,
    store: components.types.operators.client,
    typeClass: 'Operator',
    warnIfMissing: true,
  });

  buildTypeClass(context, {
    counter: typeCounters.operators.server,
    definitions: context.typesMap.operators.server,
    store: components.types.operators.server,
    typeClass: 'Operator',
    warnIfMissing: true,
  });
}

export default buildTypes;
