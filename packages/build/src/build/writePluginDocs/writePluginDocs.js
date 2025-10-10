/*
  Copyright 2020-2024 Lowdefy, Inc

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

import writeDocs from './writeDocs.js';

async function writePluginDocs({ context }) {
  if (context.stage !== 'dev') {
    return;
  }
  const blocks = context.typesMap.blocks || {};
  const actions = context.typesMap.actions || {};
  const connections = context.typesMap.connections || {};
  const operators = context.typesMap.operators || {};
  const allRequests = context.typesMap.requests || {};

  // Group requests by package name
  const requestsByPackage = {};
  for (const [type, config] of Object.entries(allRequests)) {
    const packageName = config.package;
    if (!requestsByPackage[packageName]) {
      requestsByPackage[packageName] = [];
    }
    requestsByPackage[packageName].push({ type, config });
  }

  // Add blocks and actions
  const items = [
    ...Object.entries(blocks).map(([type, config]) => ({ type, config, category: 'blocks' })),
    ...Object.entries(actions).map(([type, config]) => ({ type, config, category: 'actions' })),
  ];

  // Add connections and their associated requests
  for (const [type, config] of Object.entries(connections)) {
    items.push({
      type,
      config,
      category: 'connections',
    });

    const requests = requestsByPackage[config.package] || [];
    for (const { type: requestType, config: requestConfig } of requests) {
      items.push({
        type: requestType,
        config: requestConfig,
        category: 'requests',
        connectionType: type,
      });
    }
  }

  // Add operators
  const allOperators = {};
  if (operators.client) {
    for (const [operatorType, operatorConfig] of Object.entries(operators.client)) {
      allOperators[operatorType] = {
        ...operatorConfig,
        groups: ['client'],
      };
    }
  }
  if (operators.server) {
    for (const [operatorType, operatorConfig] of Object.entries(operators.server)) {
      if (allOperators[operatorType]) {
        allOperators[operatorType].groups.push('server');
      } else {
        allOperators[operatorType] = {
          ...operatorConfig,
          groups: ['server'],
        };
      }
    }
  }
  items.push(
    ...Object.entries(allOperators).map(([type, config]) => ({
      type,
      config,
      category: 'operators',
    }))
  );

  await writeDocs({ context, items });
}

export default writePluginDocs;
