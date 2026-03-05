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

// Node.js custom loader hooks that make CSS/Less imports resolve to empty modules.
// Used by generateDefaultTypes.js which imports block packages that contain
// CSS imports meant for bundlers (Next.js/webpack), not Node.js.

export async function load(url, context, nextLoad) {
  if (url.endsWith('.css') || url.endsWith('.less')) {
    return {
      format: 'module',
      source: 'export default {};',
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
