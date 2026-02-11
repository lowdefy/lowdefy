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

import { serializer, type } from '@lowdefy/helpers';

import writeJs from '../buildJs/writeJs.js';

async function writePageJit({ page, context }) {
  // Write page JSON
  await context.writeBuildArtifact(
    `pages/${page.pageId}/${page.pageId}.json`,
    serializer.serializeToString(page ?? {})
  );

  // Write page request JSONs
  const requests = page.requests ?? [];
  for (const request of requests) {
    await context.writeBuildArtifact(
      `pages/${page.pageId}/requests/${request.requestId}.json`,
      serializer.serializeToString(request ?? {})
    );
    // Clean up request after writing (same as writeRequests)
    delete request.properties;
    delete request.type;
    delete request.connectionId;
    delete request.auth;
  }

  // Write updated keyMap and refMap (JIT build adds new entries)
  if (!type.isObject(context.keyMap)) {
    throw new Error('keyMap is not an object.');
  }
  if (!type.isObject(context.refMap)) {
    throw new Error('refMap is not an object.');
  }
  await context.writeBuildArtifact('keyMap.json', serializer.serializeToString(context.keyMap));
  await context.writeBuildArtifact('refMap.json', serializer.serializeToString(context.refMap));

  // Write updated JS map files (JIT build extracts page-level _js functions)
  await writeJs({ context });
}

export default writePageJit;
