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

// Helper function to load all schemas from a directory as array
function loadSchemasAsArray(schemaType, excludeFields = []) {
  try {
    const schemasDir = path.join(process.cwd(), `build/schemas/${schemaType}`);
    const files = fs.readdirSync(schemasDir);
    const schemas = [];

    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const schemaPath = path.join(schemasDir, file);
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        let schema = JSON.parse(schemaContent);

        // Apply field exclusion if specified
        if (excludeFields.length > 0) {
          const filteredSchema = { ...schema };
          excludeFields.forEach((field) => delete filteredSchema[field]);
          schema = filteredSchema;
        }

        schemas.push(schema);
      }
    });

    return schemas;
  } catch (error) {
    return [];
  }
}

export default loadSchemasAsArray;
