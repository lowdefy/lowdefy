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

import { ConfigError } from '@lowdefy/errors';

import getPropertiesSchemaErrors from './getPropertiesSchemaErrors.js';

function validateBlockProperties(block, { blockSchemas, dynamicBlockId, pageId }) {
  const messages = getPropertiesSchemaErrors({ block, blockSchemas });
  if (messages.length > 0) {
    throw new ConfigError(
      `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved block "${block.blockId}" (${
        block.type
      }) has invalid properties:\n${messages.map((message) => `  - ${message}`).join('\n')}`
    );
  }
}

function walkBlocks(blocks, callback) {
  blocks.forEach((block) => {
    callback(block);
    Object.values(block.slots ?? {}).forEach((slot) => {
      walkBlocks(slot.blocks ?? [], callback);
    });
  });
}

async function validateFragment(
  context,
  {
    blocks,
    blockSchemas,
    callApiActionRefs,
    dynamicBlockId,
    pageId,
    pageRequests,
    requestActionRefs,
  }
) {
  walkBlocks(blocks, (block) => {
    validateBlockProperties(block, { blockSchemas, dynamicBlockId, pageId });
  });

  // Request actions can only reference requests defined statically on the page —
  // request artifacts are written at build time. A ValidateDynamic step checks
  // content with no page (pageRequests null); the policy's requests list is
  // its check, and page get repeats this one.
  if (pageRequests !== null) {
    const pageRequestIds = new Set(pageRequests.map((request) => request.requestId));
    requestActionRefs.forEach(({ requestId, blockId, eventId }) => {
      if (!pageRequestIds.has(requestId)) {
        throw new ConfigError(
          `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved content references request "${requestId}" on event "${eventId}" on block "${blockId}" which is not defined on the page.`
        );
      }
    });
  }

  // CallAPI refs fail resolution instead of the user's click — same checks the
  // HTTP endpoint route applies.
  await Promise.all(
    callApiActionRefs.map(async ({ endpointId, blockId, eventId }) => {
      const endpointConfig = await context.readConfigFile(`api/${endpointId}.json`);
      if (!endpointConfig || endpointConfig.type === 'InternalApi') {
        throw new ConfigError(
          `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved content has a CallAPI action on event "${eventId}" on block "${blockId}" targeting endpoint "${endpointId}" which does not exist or is not accessible from client pages.`
        );
      }
    })
  );
}

export default validateFragment;
