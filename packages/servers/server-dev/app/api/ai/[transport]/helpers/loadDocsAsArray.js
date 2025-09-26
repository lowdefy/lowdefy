import fs from 'fs';
import path from 'path';

// Helper function to load block/action/operator names from filenames
function loadDocsAsArray(docType) {
  try {
    const docsDir = path.join(process.cwd(), 'build', 'docs', docType);

    const files = fs.readdirSync(docsDir);

    const docs = [];

    files.forEach((file) => {
      if (file.endsWith('.md')) {
        // Use filename as title (remove .md extension)
        const title = file.replace('.md', '');

        const doc = {
          title: title,
          description: 'Description to be added.', // TODO: Extract description from md file
        };
        docs.push(doc);
      }
    });

    return docs;
  } catch (error) {
    return [];
  }
}

export default loadDocsAsArray;
