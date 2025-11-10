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

async function writeRequestSchemas({ connectionType, context, connectionPackage }) {
  try {
    const allRequests = context.typesMap.requests || {};

    // Filter requests that belong to this connection package
    const requests = Object.fromEntries(
      Object.entries(allRequests).filter(
        ([, requestConfig]) => requestConfig.package === connectionPackage
      )
    );

    for (const [requestType, requestConfig] of Object.entries(requests)) {
      const requestSchema = {
        connection: connectionType,
        type: requestType,
        package: requestConfig.package,
        description: `${requestType} request`,
      };

      // Try to read schema.js from the package
      try {
        const packagePath = path.join(process.cwd(), 'node_modules', requestConfig.package);
        const schemaPath = path.join(
          packagePath,
          'dist',
          'connections',
          connectionType,
          requestConfig.originalTypeName,
          'schema.js'
        );

        if (fs.existsSync(schemaPath)) {
          const { default: schema } = await import(`file://${schemaPath}`);
          requestSchema.schema = schema;
        }
      } catch (error) {
        // Continue without schema if it can't be read
        context.logger.warn(`Could not read schema for ${requestType}:`, error.message);
      }

      const schemaFileName = `${requestType}.json`;
      const individualSchemaContent = JSON.stringify(requestSchema, null, 2);

      await context.writeBuildArtifact(
        `schemas/requests/${connectionType}/${schemaFileName}`,
        individualSchemaContent
      );
    }
  } catch (error) {
    context.logger.warn('Failed to write request schemas:', error.message);
  }
}

export default writeRequestSchemas;
