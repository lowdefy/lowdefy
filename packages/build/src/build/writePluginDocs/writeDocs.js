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

import fs from 'fs';
import path from 'path';

async function writePluginDocs({ context }) {
  try {
    const blocks = context.typesMap.blocks || {};
    const actions = context.typesMap.actions || {};
    const connections = context.typesMap.connections || {};
    const operators = context.typesMap.operators || {};
    const allRequests = context.typesMap.requests || {};

    const items = [
      ...Object.entries(blocks).map(([type, config]) => ({ type, config, category: 'blocks' })),
      ...Object.entries(actions).map(([type, config]) => ({ type, config, category: 'actions' })),
      ...Object.entries(connections).map(([type, config]) => ({
        type,
        config,
        category: 'connections',
      })),
      ...Object.entries(allRequests).map(([type, config]) => ({
        type,
        config,
        category: 'requests',
        connectionType: config.connectionType,
      })),
    ];

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

    for (const { type, config, category, connectionType } of items) {
      // Try to read documentation.md from the package
      let documentationContent = '';
      try {
        const packagePath = path.join(process.cwd(), 'node_modules', config.package);
        let documentationPath;
        if (category === 'requests') {
          documentationPath = path.join(
            packagePath,
            'dist',
            'connections',
            connectionType,
            config.originalTypeName,
            'documentation.md'
          );
        } else {
          documentationPath = path.join(
            packagePath,
            'dist',
            category,
            config.originalTypeName,
            'documentation.md'
          );
        }

        if (fs.existsSync(documentationPath)) {
          documentationContent = fs.readFileSync(documentationPath, 'utf8');
        }
      } catch (error) {
        // Continue without documentation if it can't be read
        context.logger.warn(`Could not read documentation for ${type}:`, error.message);
      }

      const documentationFileName = `${type}.md`;
      let outputPath;
      if (category === 'requests') {
        outputPath = `docs/requests/${connectionType}/${documentationFileName}`;
      } else {
        outputPath = `docs/${category}/${documentationFileName}`;
      }

      await context.writeBuildArtifact(outputPath, documentationContent);
    }
  } catch (error) {
    context.logger.warn('Failed to write plugin docs:', error.message);
  }
}

export default writePluginDocs;
