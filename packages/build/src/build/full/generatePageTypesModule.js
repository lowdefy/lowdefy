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

import generateIconEntries from '../icons/generateIconEntries.js';

const IMPORT_PATHS = {
  actions: 'actions',
  blocks: 'blocks',
  operators: 'operators/client',
};

// Import aliases are generated (a0, b0, o0) rather than taken from type names:
// a block and an action can share a name (Throw), and no identifier in emitted
// code comes from config. Keys and specifiers are emitted through JSON.stringify.
// Icons are data, inlined in the module: its page's icons arrive with its code
// in one chunk, and icon node constants (n0) never clash with import aliases.
function generatePageTypesModule({ iconData, imports }) {
  const lines = [];
  const exports = [];
  Object.entries(IMPORT_PATHS).forEach(([category, importPath]) => {
    const entries = imports[category].map((typeImport, index) => {
      const alias = `${category[0]}${index}`;
      lines.push(
        `import { ${typeImport.originalTypeName} as ${alias} } from ${JSON.stringify(
          `${typeImport.package}/${importPath}`
        )};`
      );
      return `    ${JSON.stringify(typeImport.typeName)}: ${alias},`;
    });
    exports.push(`  ${category}: {\n${entries.join('\n')}\n  },`);
  });
  const pageIconData = Object.fromEntries(imports.icons.map((name) => [name, iconData[name]]));
  const { constants, entries } = generateIconEntries({ iconData: pageIconData });
  lines.push(...constants);
  exports.push(`  icons: {\n${entries.map((entry) => `    ${entry}`).join('\n')}\n  },`);
  return `${lines.join('\n')}\nexport default {\n${exports.join('\n')}\n};\n`;
}

export default generatePageTypesModule;
