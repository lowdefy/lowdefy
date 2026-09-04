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

const EXPORTS = 'export { closures };\nexport default closures;\n';

// Test-only: instantiate an emitted closure module without a bundler. The
// emitted source has no imports and exactly one export tail, so swapping the
// tail for a return turns the module into a function body.
function loadClosureModule(code) {
  if (!code.endsWith(EXPORTS)) {
    throw new Error('Emitted closure module does not end with the expected export tail.');
  }
  const body = code
    .slice(0, -EXPORTS.length)
    .replace(/^export const /gm, 'const ')
    .concat('return { closures, env, operatorPrefix };\n');
  // eslint-disable-next-line no-new-func
  return new Function(body)();
}

export default loadClosureModule;
