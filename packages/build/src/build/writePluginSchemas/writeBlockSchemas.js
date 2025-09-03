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

async function writeBlockSchemas({ context }) {
  try {
    const blocks = context.typesMap.blocks || {};

    for (const [blockType, blockConfig] of Object.entries(blocks)) {
      const blockSchema = {
        type: blockType,
        package: blockConfig.package,
        description: `${blockType} block`,
      };

      // Try to read schema.json from the package
      try {
        const packagePath = path.join(process.cwd(), 'node_modules', blockConfig.package);
        const schemaPath = path.join(packagePath, 'dist', 'blocks', blockType, 'schema.json');

        if (fs.existsSync(schemaPath)) {
          const schemaContent = fs.readFileSync(schemaPath, 'utf8');
          const schema = JSON.parse(schemaContent);
          blockSchema.schema = schema;
        }
      } catch (error) {
        // Continue without schema if it can't be read
        console.warn(`Could not read schema for ${blockType}:`, error.message);
      }

      const schemaFileName = `${blockType}.json`;
      const individualSchemaContent = JSON.stringify(blockSchema, null, 2);

      await context.writeBuildArtifact(`schemas/blocks/${schemaFileName}`, individualSchemaContent);
    }
  } catch (error) {
    console.warn('Failed to write block schemas:', error.message);
  }
}

export default writeBlockSchemas;
