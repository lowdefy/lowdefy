/*
  Copyright 2020-2026 Lowdefy, Inc

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
import addFilePluginSpecifiers from './addFilePluginSpecifiers.js';

// The import path under each plugin package, per type class.
const importPaths = {
  actions: 'actions',
  blocks: 'blocks',
  operators: 'operators/client',
};

const kinds = {
  actions: 'actions',
  blocks: 'blocks',
  operators: 'operators.client',
};

// Local identifiers are generated, never derived from a type name: a page
// module carries three type classes in one scope, and a block and an action
// may share a name.
function generatePageImportFile({ artifactPath, context, imports }) {
  const lines = [];
  const exports = [];
  let counter = 0;
  ['actions', 'blocks', 'operators'].forEach((typeClass) => {
    const entries = addFilePluginSpecifiers({
      artifactPath,
      context,
      imports: imports[typeClass],
      kind: kinds[typeClass],
    }).map((imported) => {
      counter += 1;
      const identifier = `_t${counter}`;
      if (imported.filePluginSpecifier) {
        lines.push(`import ${identifier} from ${JSON.stringify(imported.filePluginSpecifier)};`);
      } else {
        lines.push(
          `import { ${imported.originalTypeName} as ${identifier} } from ${JSON.stringify(
            `${imported.package}/${importPaths[typeClass]}`
          )};`
        );
      }
      return `  ${JSON.stringify(imported.typeName)}: ${identifier},`;
    });
    if (entries.length === 0) {
      exports.push(`export const ${typeClass} = {};`);
      return;
    }
    exports.push(`export const ${typeClass} = {\n${entries.join('\n')}\n};`);
  });
  return `${lines.join('\n')}${lines.length > 0 ? '\n' : ''}${exports.join('\n')}\n`;
}

export default generatePageImportFile;
