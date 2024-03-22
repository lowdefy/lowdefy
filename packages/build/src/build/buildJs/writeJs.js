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

import getClientJs from './getClientJs.js';
import generateJsFile from './generateJsFile.js';

// parse components to see which hashes have been removed, the removed hashes are the server js, the remainder the client.
async function writeJs({ components, context }) {
  const allHashes = Object.keys(context.jsMap);
  const clientHashes = getClientJs(components);
  const clientJs = {};
  const serverJs = {};
  allHashes.forEach((hash) => {
    if (clientHashes.includes(hash)) {
      clientJs[hash] = context.jsMap[hash];
    } else {
      serverJs[hash] = context.jsMap[hash];
    }
  });

  await context.writeBuildArtifact(
    'plugins/operators/clientJsOperator.js',
    generateJsFile({
      map: clientJs,
      functionPrototype: `{ actions, arrayIndices, input, lowdefyGlobal, pageId, requests, state, user }`,
    })
  );
  await context.writeBuildArtifact(
    'plugins/operators/serverJsOperator.js',
    generateJsFile({
      map: serverJs,
      functionPrototype: `{ arrayIndices, env, payload, secrets, user }`,
    })
  );
}

export default writeJs;
