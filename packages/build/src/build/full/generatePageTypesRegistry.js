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

// Each import() is a chunk the client loads for one page. The app-wide barrels
// stay as dynamic imports: icons (one shared chunk every page loads, since icon
// names are often computed at runtime) and the full type set (loaded when a
// Dynamic fragment uses types outside its page's set).
function generatePageTypesRegistry({ typesKeys }) {
  const entries = typesKeys.map(
    (typesKey) =>
      `  ${JSON.stringify(typesKey)}: () => import(${JSON.stringify(
        `./pageTypes/${typesKey}.js`
      )}),`
  );
  return `export const icons = () => import('./icons.js');

export const allTypes = () =>
  Promise.all([import('./actions.js'), import('./blocks.js'), import('./operators/client.js')]).then(
    ([actions, blocks, operators]) => ({
      actions: actions.default,
      blocks: blocks.default,
      operators: operators.default,
    })
  );

export default {
${entries.join('\n')}
};
`;
}

export default generatePageTypesRegistry;
