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

import isReportsPluginDeclared from './isReportsPluginDeclared.js';

// The one artifact the servers import for the reports capability. It is always
// written so the servers' static import resolves for every app, but only an app
// that declares @lowdefy/plugin-reports pulls the report renderers, the icon
// components, and the client operators into its request context. Every other app
// gets empty maps and never loads those modules server-side.
const DECLARED_CONTENT = `import blocksStatic from './blocksStatic.js';
import icons from './icons.js';
import clientOperators from './operators/client.js';
import clientJsMap from './operators/clientJsMap.js';
export default { blocksStatic, clientJsMap, clientOperators, icons };
`;

const UNDECLARED_CONTENT = `export default { blocksStatic: {}, clientJsMap: {}, clientOperators: {}, icons: {} };
`;

async function writeReportsRuntime({ context }) {
  const content = isReportsPluginDeclared({ context }) ? DECLARED_CONTENT : UNDECLARED_CONTENT;
  await context.writeBuildArtifact('plugins/reportsRuntime.js', content);
}

export default writeReportsRuntime;
