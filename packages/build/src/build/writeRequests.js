/*
  Copyright 2020 Lowdefy, Inc

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

function getRequestsAndMutationsOnBlock({ block, requests, mutations, pageId }) {
  if (!type.isObject(block)) {
    throw new Error(`Block is not an object on page "${pageId}".`);
  }
  if (!type.isNone(block.requests)) {
    if (!type.isArray(block.requests)) {
      throw new Error(`Requests is not an array on page "${pageId}".`);
    }
    block.requests.forEach((request) => {
      requests.push(serializer.copy(request));
      delete request.properties;
    });
  }
  if (!type.isNone(block.mutations)) {
    if (!type.isArray(block.mutations)) {
      throw new Error(`Mutations is not an array on page "${pageId}".`);
    }
    block.mutations.forEach((mutation) => {
      mutations.push(serializer.copy(mutation));
      delete mutation.properties;
    });
  }
  if (type.isObject(block.areas)) {
    Object.keys(block.areas).forEach((key) => {
      if (type.isNone(block.areas[key].blocks)) return;
      if (!type.isArray(block.areas[key].blocks)) {
        throw new Error(
          `Blocks is not an array on page "${pageId}", block "${block.blockId}", area "${key}".`
        );
      }
      block.areas[key].blocks.forEach((blk) => {
        getRequestsAndMutationsOnBlock({ block: blk, requests, mutations, pageId });
      });
    });
  }
}

async function updateRequestsOnPage({ page, context }) {
  if (!type.isObject(page)) {
    throw new Error(`Page is not an object.`);
  }
  const requests = [];
  const mutations = [];
  getRequestsAndMutationsOnBlock({ block: page, requests, mutations, pageId: page.pageId });

  const writeRequestPromises = requests.map(async (request) => {
    await context.artifactSetter.set({
      filePath: `pages/${page.pageId}/requests/${request.requestId}.json`,
      content: JSON.stringify(request, null, 2),
    });
    await context.logger.info(`Updated request ${request.requestId} on page ${page.pageId}`);
  });
  const writeMutationPromises = mutations.map(async (mutation) => {
    await context.artifactSetter.set({
      filePath: `pages/${page.pageId}/mutations/${mutation.mutationId}.json`,
      content: JSON.stringify(mutation, null, 2),
    });
    await context.logger.info(`Updated mutation ${mutation.mutationId} on page ${page.pageId}`);
  });

  return Promise.all([...writeRequestPromises, ...writeMutationPromises]);
}

async function writeRequests({ components, context }) {
  if (type.isNone(components.pages)) return;
  if (!type.isArray(components.pages)) {
    throw new Error(`Pages is not an array.`);
  }
  const writePromises = components.pages.map((page) => updateRequestsOnPage({ page, context }));
  return Promise.all(writePromises);
}

export { getRequestsAndMutationsOnBlock };

export default writeRequests;
