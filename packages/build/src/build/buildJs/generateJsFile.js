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

// Renders one js-map module: import statements for module references above an
// object keyed by hash. Inline bodies become arrow functions with the
// environment's prototype; module references bind to their import alias, so
// the operator calls both the same way. Aliases follow the sorted hash order
// so the output is stable across builds.
function generateJsFile({ map, modules = {}, functionPrototype }) {
  const moduleHashes = Object.keys(modules).sort();
  const aliases = {};
  const imports = moduleHashes.map((hash, index) => {
    const alias = `m${index}`;
    aliases[hash] = alias;
    const { importPath, exportName } = modules[hash];
    if (exportName === 'default') {
      return `import ${alias} from '${importPath}';\n`;
    }
    return `import { ${exportName} as ${alias} } from '${importPath}';\n`;
  });
  const entries = [
    ...Object.keys(map).map((hash) => `  '${hash}': (${functionPrototype}) => { ${map[hash]} },\n`),
    ...moduleHashes.map((hash) => `  '${hash}': ${aliases[hash]},\n`),
  ];
  const importBlock = imports.length > 0 ? `${imports.join('')}\n` : '';
  return `\n${importBlock}export default {\n${entries.join('')}  };`;
}

export default generateJsFile;
