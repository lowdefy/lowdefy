import fs from 'fs';
import path from 'path';

// Helper function to load individual schema
function loadIndividualSchema(schemaType, identifier) {
  try {
    const schemaPath = path.join(process.cwd(), `build/schemas/${schemaType}/${identifier}.json`);
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    return JSON.parse(schemaContent);
  } catch (error) {
    return null;
  }
}

export default loadIndividualSchema;
