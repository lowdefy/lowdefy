/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { get, set, type } from '@lowdefy/helpers';

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
  - set operators list on context blocks
*/

function getContextOperators(block) {
  const stripContext = (_, value) => {
    if (get(value, 'meta.category') === 'context') {
      return null;
    }
    return value;
  };
  // eslint-disable-next-line no-unused-vars
  const { requests, ...webBlock } = block;
  webBlock.areas = JSON.parse(JSON.stringify(webBlock.areas || {}), stripContext);
  const operators = new Set();
  const pushOperators = (_, value) => {
    if (type.isObject(value) && Object.keys(value).length === 1) {
      const key = Object.keys(value)[0];
      const [op, _] = key.split('.');
      const operator = op.replace(/^(\_+)/gm, '_');
      if (operator.length > 1 && operator[0] === '_') {
        operators.add(operator);
      }
    }
    return value;
  };
  JSON.parse(JSON.stringify(webBlock), pushOperators);
  return [...operators];
}

function fillContextOperators(block) {
  if (get(block, 'meta.category') === 'context') {
    block.operators = getContextOperators(block);
  }
  Object.keys(block.areas || {}).forEach((key) => {
    block.areas[key].blocks.map((blk) => {
      fillContextOperators(blk);
    });
  });
}

function buildRequests(block, blockContext) {
  if (!type.isNone(block.requests)) {
    if (!type.isArray(block.requests)) {
      throw new Error(
        `Requests is not an array at ${block.blockId} on page ${
          blockContext.pageId
        }. Received ${JSON.stringify(block.requests)}`
      );
    }
    block.requests.forEach((request) => {
      request.auth = blockContext.auth;
      request.requestId = request.id;
      request.contextId = blockContext.contextId;
      request.id = `request:${blockContext.pageId}:${blockContext.contextId}:${request.id}`;
      blockContext.requests.push(request);
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

async function setBlockMeta(block, metaLoader, pageId) {
  if (type.isNone(block.type)) {
    throw new Error(`Block type is not defined at ${block.blockId} on page ${pageId}.`);
  }
  if (!type.isString(block.type)) {
    throw new Error(
      `Block type is not a string at ${block.blockId} on page ${pageId}. Received ${JSON.stringify(
        block.type
      )}`
    );
  }
  const meta = await metaLoader.load(block.type);
  if (!meta) {
    throw new Error(
      `Invalid Block type at ${block.blockId} on page ${pageId}. Received ${JSON.stringify(
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
  // Add user defined loading
  if (block.loading) {
    block.meta.loading = block.loading;
  }
}

async function buildBlock(block, blockContext) {
  if (!type.isObject(block)) {
    throw new Error(
      `Expected block to be an object on ${blockContext.pageId}. Received ${JSON.stringify(block)}`
    );
  }
  if (type.isUndefined(block.id)) {
    throw new Error(`Block id missing at page ${blockContext.pageId}`);
  }
  block.blockId = block.id;
  block.id = `block:${blockContext.pageId}:${block.id}`;
  await setBlockMeta(block, blockContext.metaLoader, blockContext.pageId);
  let newBlockContext = blockContext;
  if (block.meta.category === 'context') {
    newBlockContext = {
      auth: blockContext.auth,
      contextId: block.blockId,
      metaLoader: blockContext.metaLoader,
      pageId: blockContext.pageId,
      requests: [],
    };
  }
  buildRequests(block, newBlockContext);
  if (block.meta.category === 'context') {
    block.requests = newBlockContext.requests;
  }
  if (!type.isNone(block.blocks)) {
    if (!type.isArray(block.blocks)) {
      throw new Error(
        `Blocks at ${block.blockId} on page ${
          newBlockContext.pageId
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
            newBlockContext.pageId
          }. Received ${JSON.stringify(block.areas[key].blocks)}`
        );
      }
      const blockPromises = block.areas[key].blocks.map(async (blk) => {
        await buildBlock(blk, newBlockContext);
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
    if (components.auth.include.includes(page.pageId)) {
      page.auth = components.auth.set;
    } else {
      page.auth = components.auth.default;
    }
    await buildBlock(page, {
      auth: page.auth,
      pageId: page.pageId,
      requests: [],
      metaLoader: context.metaLoader,
    });
    // set page.id since buildBlock sets id as well.
    page.id = `page:${page.pageId}`;
    fillContextOperators(page);
  });
  await Promise.all(pageBuildPromises);
  return components;
}

export default buildPages;
