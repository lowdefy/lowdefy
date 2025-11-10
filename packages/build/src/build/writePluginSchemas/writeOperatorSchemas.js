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

async function writeOperatorSchemas({ context }) {
  try {
    const operators = context.typesMap.operators || {};
    const allOperators = {};

    // Process client operators
    if (operators.client) {
      for (const [operatorType, operatorConfig] of Object.entries(operators.client)) {
        allOperators[operatorType] = {
          ...operatorConfig,
          groups: ['client'],
        };
      }
    }

    // Process server operators
    if (operators.server) {
      for (const [operatorType, operatorConfig] of Object.entries(operators.server)) {
        if (allOperators[operatorType]) {
          // Operator exists in both client and server
          allOperators[operatorType].groups.push('server');
        } else {
          // Operator only in server
          allOperators[operatorType] = {
            ...operatorConfig,
            groups: ['server'],
          };
        }
      }
    }

    for (const [operatorType, operatorConfig] of Object.entries(allOperators)) {
      const operatorSchema = {
        type: operatorType,
        package: operatorConfig.package,
        groups: operatorConfig.groups,
        description: `${operatorType} operator`,
      };

      const schemaFileName = `${operatorType}.json`;
      const individualSchemaContent = JSON.stringify(operatorSchema, null, 2);

      await context.writeBuildArtifact(
        `schemas/operators/${schemaFileName}`,
        individualSchemaContent
      );
    }
  } catch (error) {
    context.logger.warn('Failed to write operator schemas:', error.message);
  }
}

export default writeOperatorSchemas;
