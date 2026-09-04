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

import basicTypes from '@lowdefy/blocks-basic/types';
import loaderTypes from '@lowdefy/blocks-loaders/types';
import collectExceptions from '../utils/collectExceptions.js';
import { FILE_PLUGIN_PACKAGE_ID } from './filePlugins/discoverFilePlugins.js';
import findSimilarString from '../utils/findSimilarString.js';

function buildTypeClass(context, { checkSlug, counter, definitions, store, typeClass }) {
  const counts = counter.getCounts();
  const definedTypes = Object.keys(definitions);
  Object.keys(counts).forEach((typeName) => {
    if (!definitions[typeName]) {
      const configKey = counter.getLocation(typeName);

      let message = `${typeClass} type "${typeName}" was used but is not defined.`;
      const suggestion = findSimilarString({ input: typeName, candidates: definedTypes });
      if (suggestion) {
        message += ` Did you mean "${suggestion}"?`;
      }
      collectExceptions(context, new ConfigError(message, { configKey, checkSlug }));
      return;
    }
    store[typeName] = {
      originalTypeName: definitions[typeName].originalTypeName ?? typeName,
      package: definitions[typeName].package,
      version: definitions[typeName].version,
      count: counts[typeName],
    };
    // A file plugin has no package to import from, so the import and schema-map
    // writers need the file it was discovered at instead.
    if (definitions[typeName].packageId === FILE_PLUGIN_PACKAGE_ID) {
      store[typeName].packageId = FILE_PLUGIN_PACKAGE_ID;
      store[typeName].file = definitions[typeName].file;
      store[typeName].relativePath = definitions[typeName].relativePath;
    }
  });
}

function buildTypes({ components, context }) {
  const { typeCounters } = context;

  // Type-name collisions and bad file-plugin names are found while the typesMap
  // is assembled in createContext, before there is anywhere to collect them.
  (context.filePluginExceptions ?? []).forEach((exception) => {
    collectExceptions(context, exception);
  });

  // Add Mandatory Types
  // Add operators used by form validation
  typeCounters.operators.client.increment('_not');
  typeCounters.operators.client.increment('_type');
  // Add loaders and basic
  basicTypes.blocks.forEach((block) => typeCounters.blocks.increment(block));
  loaderTypes.blocks.forEach((block) => typeCounters.blocks.increment(block));
  // Used for DisplayMessage in @lowdefy/client
  typeCounters.blocks.increment('Message');
  // Used by blocks-antd Header/PageHeaderMenu/PageSiderMenu darkModeToggle
  typeCounters.actions.increment('SetDarkMode');

  components.types = {
    actions: {},
    agents: {},
    auth: {
      adapters: {},
      providers: {},
      strategies: {},
    },
    blocks: {},
    connections: {},
    notifications: {},
    requests: {},
    steps: {},
    websockets: {},
    api: {},
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
    checkSlug: 'action-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.agents,
    definitions: context.typesMap.agents,
    store: components.types.agents,
    typeClass: 'Agent',
    checkSlug: 'agent-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.auth.adapters,
    definitions: context.typesMap.auth.adapters,
    store: components.types.auth.adapters,
    typeClass: 'Auth adapter',
    checkSlug: 'auth-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.auth.providers,
    definitions: context.typesMap.auth.providers,
    store: components.types.auth.providers,
    typeClass: 'Auth provider',
    checkSlug: 'auth-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.auth.strategies,
    definitions: context.typesMap.auth.strategies,
    store: components.types.auth.strategies,
    typeClass: 'Auth strategy',
    checkSlug: 'auth-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.blocks,
    definitions: context.typesMap.blocks,
    store: components.types.blocks,
    typeClass: 'Block',
    checkSlug: 'block-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.connections,
    definitions: context.typesMap.connections,
    store: components.types.connections,
    typeClass: 'Connection',
    checkSlug: 'connection-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.notifications,
    definitions: context.typesMap.notifications,
    store: components.types.notifications,
    typeClass: 'Notification',
    checkSlug: 'notification-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.requests,
    definitions: context.typesMap.requests,
    store: components.types.requests,
    typeClass: 'Request',
    checkSlug: 'request-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.steps,
    definitions: context.typesMap.steps,
    store: components.types.steps,
    typeClass: 'Step',
    checkSlug: 'step-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.websockets,
    definitions: context.typesMap.websockets,
    store: components.types.websockets,
    typeClass: 'Websocket',
    checkSlug: 'websocket-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.operators.client,
    definitions: context.typesMap.operators.client,
    store: components.types.operators.client,
    typeClass: 'Operator',
    checkSlug: 'operator-types',
  });

  buildTypeClass(context, {
    counter: typeCounters.operators.server,
    definitions: context.typesMap.operators.server,
    store: components.types.operators.server,
    typeClass: 'Operator',
    checkSlug: 'operator-types',
  });
}

export default buildTypes;
