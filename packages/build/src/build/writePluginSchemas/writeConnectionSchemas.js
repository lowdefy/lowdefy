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

async function writeConnectionSchemas({ context }) {
  try {
    const connections = context.typesMap.connections || {};

    for (const [connectionType, connectionConfig] of Object.entries(connections)) {
      const connectionSchema = {
        type: connectionType,
        package: connectionConfig.package,
        description: `${connectionType} connection`,
      };

      // Try to read schema.js from the package
      try {
        const packagePath = path.join(process.cwd(), 'node_modules', connectionConfig.package);
        const schemaPath = path.join(
          packagePath,
          'dist',
          'connections',
          connectionConfig.originalTypeName,
          'schema.js'
        );

        if (fs.existsSync(schemaPath)) {
          const { default: schema } = await import(`file://${schemaPath}`);
          connectionSchema.schema = schema;
        }
      } catch (error) {
        // Continue without schema if it can't be read
        context.logger.warn(`Could not read schema for ${connectionType}:`, error.message);
      }

      const schemaFileName = `${connectionType}.json`;
      const individualSchemaContent = JSON.stringify(connectionSchema, null, 2);

      await context.writeBuildArtifact(
        `schemas/connections/${schemaFileName}`,
        individualSchemaContent
      );
    }
  } catch (error) {
    context.logger.warn('Failed to write connection schemas:', error.message);
  }
}

export default writeConnectionSchemas;
