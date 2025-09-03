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
