/* eslint-disable no-param-reassign */

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

import { set, type } from '@lowdefy/helpers';

/* Page and block build steps

Pages:
  - set pageId = id
  - set id = `page:${page.id}`

Blocks:
  - set blockId = id
  - set id = `block:${pageId}:${block.id}` if not a page
  - set request ids
  - set block meta
  - set blocks to areas.content
*/

function buildRequests(block, context) {
  if (!type.isNone(block.requests)) {
    if (!type.isArray(block.requests)) {
      throw new Error(
        `Requests is not an array at ${block.blockId} on page ${
          context.pageId
        }. Received ${JSON.stringify(block.requests)}`
      );
    }
    block.requests.forEach((request) => {
      request.requestId = request.id;
      request.id = `request:${context.pageId}:${context.contextId}:${request.id}`;
      context.requests.push(request);
    });
    delete block.requests;
  }
}

async function checkPageIsContext(page, metaLoader) {
  if (type.isNone(page.type)) {
    throw new Error(`Page type is not defined at ${page.pageId}.`);
  }
  if (!type.isString(page.type)) {
    throw new Error(
      `Page type is not a string at ${page.pageId}. Received ${JSON.stringify(page.type)}`
    );
  }
  const meta = await metaLoader.load(page.type);
  if (!meta) {
    throw new Error(
      `Invalid block type at page ${page.pageId}. Received ${JSON.stringify(page.type)}`
    );
  }
  if (meta.category !== 'context') {
    throw new Error(
      `Page ${page.pageId} is not of category "context". Received ${JSON.stringify(page.type)}`
    );
  }
}

async function setBlockMeta(block, context) {
  if (type.isNone(block.type)) {
    throw new Error(`Block type is not defined at ${block.blockId} on page ${context.pageId}.`);
  }
  if (!type.isString(block.type)) {
    throw new Error(
      `Block type is not a string at ${block.blockId} on page ${
        context.pageId
      }. Received ${JSON.stringify(block.type)}`
    );
  }
  const meta = await context.metaLoader.load(block.type);
  if (!meta) {
    throw new Error(
      `Invalid Block type at ${block.blockId} on page ${context.pageId}. Received ${JSON.stringify(
        block.type
      )}`
    );
  }
  const { category, loading, moduleFederation, valueType } = meta;
  block.meta = { category, loading, moduleFederation };
  if (category === 'input') {
    block.meta.valueType = valueType;
  }

  if (category === 'list') {
    // include valueType to ensure block has value on init
    block.meta.valueType = 'array';
  }
}

async function buildBlock(block, context) {
  if (!type.isObject(block)) {
    throw new Error(
      `Expected block to be an object on ${context.pageId}. Received ${JSON.stringify(block)}`
    );
  }
  if (type.isUndefined(block.id)) {
    throw new Error(`Block id missing at page ${context.pageId}`);
  }
  block.blockId = block.id;
  block.id = `block:${context.pageId}:${block.id}`;
  await setBlockMeta(block, context);
  if (block.meta.category === 'context') {
    context.requests = [];
    context.contextId = block.blockId;
  }
  buildRequests(block, context);
  if (block.meta.category === 'context') {
    block.requests = context.requests;
  }
  if (!type.isNone(block.blocks)) {
    if (!type.isArray(block.blocks)) {
      throw new Error(
        `Blocks at ${block.blockId} on page ${
          context.pageId
        } is not an array. Received ${JSON.stringify(block.blocks)}`
      );
    }
    set(block, 'areas.content.blocks', block.blocks);
    delete block.blocks;
  }
  if (type.isObject(block.areas)) {
    let promises = [];
    Object.keys(block.areas).forEach((key) => {
      if (type.isNone(block.areas[key].blocks)) {
        block.areas[key].blocks = [];
      }
      if (!type.isArray(block.areas[key].blocks)) {
        throw new Error(
          `Expected blocks to be an array at ${block.blockId} in area ${key} on page ${
            context.pageId
          }. Received ${JSON.stringify(block.areas[key].blocks)}`
        );
      }
      const blockPromises = block.areas[key].blocks.map(async (blk) => {
        await buildBlock(blk, context);
      });
      promises = promises.concat(blockPromises);
    });
    await Promise.all(promises);
  }
}

async function buildPages({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  const pageBuildPromises = pages.map(async (page, i) => {
    if (type.isUndefined(page.id)) {
      throw new Error(`Page id missing at page ${i}`);
    }
    page.pageId = page.id;

    await checkPageIsContext(page, context.metaLoader);
    await buildBlock(page, {
      pageId: page.pageId,
      requests: [],
      metaLoader: context.metaLoader,
    });
    // set page.id since buildBlock sets id as well.
    page.id = `page:${page.pageId}`;
  });
  await Promise.all(pageBuildPromises);
  return components;
}

export default buildPages;
