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

import generateJsFile from './generateJsFile.js';

async function writeJs({ context }) {
  await context.writeBuildArtifact(
    'plugins/operators/clientJsMap.js',
    generateJsFile({
      map: context.jsMap.client,
      functionPrototype: `{ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }`,
    })
  );
  await context.writeBuildArtifact(
    'plugins/operators/serverJsMap.js',
    generateJsFile({
      map: context.jsMap.server,
      functionPrototype: `{ item, payload, secrets, state, step, user }`,
    })
  );
}

export default writeJs;
