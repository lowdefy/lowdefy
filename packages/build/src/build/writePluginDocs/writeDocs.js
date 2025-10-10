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

async function writeDocs({ context, items }) {
  try {
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
        } else if (category === 'operators') {
          // For operators, determine the environment
          let env = 'shared';
          if (config.groups && config.groups.length === 1) {
            if (config.groups.includes('client')) {
              env = 'client';
            } else if (config.groups.includes('server')) {
              env = 'server';
            }
          }
          // If groups has both or none, use 'shared'
          const name = config.originalTypeName.replace(/^_/, '');
          documentationPath = path.join(
            packagePath,
            'dist',
            'operators',
            env,
            name,
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

export default writeDocs;
