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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import createEvaluateOperators from '../../../context/createEvaluateOperators.js';
import invokeEndpoint from '../../endpoints/invokeEndpoint.js';
import checkDynamicContent from './checkDynamicContent.js';
import createContentError from './createContentError.js';
import flagTypesOutsidePage from './flagTypesOutsidePage.js';
import loadDynamicArtifacts from './loadDynamicArtifacts.js';
import unescapeOperators from './unescapeOperators.js';

const MAX_DYNAMIC_DEPTH = 5;

function collectDynamicBlocks(block, found) {
  if (block.type === 'Dynamic') {
    // A Dynamic block's content comes from resolution; its fallback slot is
    // resolved separately when a failure activates it.
    found.push(block);
    return;
  }
  Object.values(block.slots ?? {}).forEach((slot) => {
    (slot.blocks ?? []).forEach((child) => collectDynamicBlocks(child, found));
  });
}

function setResolvedContent(block, blocks) {
  if (!block.slots) {
    block.slots = {};
  }
  block.slots.content = { ...(block.slots.content ?? {}), blocks };
  delete block.slots.fallback;
  delete block.properties.endpointId;
  delete block.properties.params;
  delete block.properties.policy;
  delete block.properties.required;
  delete block.properties.types;
}

async function resolveBlocks(context, { blocks, depth, shared }) {
  const found = [];
  blocks.forEach((block) => collectDynamicBlocks(block, found));
  await Promise.all(found.map((block) => resolveDynamicBlock(context, { block, depth, shared })));
}

async function resolveDynamicBlock(context, { block, depth, shared }) {
  const { logger } = context;
  const { endpointId, params, required } = block.properties;
  // Build validated the policy id. The endpoint's data stays literal; only the
  // blocks of a ValidateDynamic step that passed with this policy may come
  // back as config, and the policy is checked again on the final content.
  const policy = type.isNone(block.properties.policy)
    ? null
    : shared.artifacts.dynamicPolicies[block.properties.policy];
  try {
    if (depth >= MAX_DYNAMIC_DEPTH) {
      throw new ConfigError(
        `Dynamic block "${block.blockId}" on page "${shared.pageId}" exceeded the maximum dynamic nesting depth of ${MAX_DYNAMIC_DEPTH}.`,
        { configKey: block['~k'] }
      );
    }
    const { error, response, status } = await invokeEndpoint(context, {
      endpointId,
      payload: {
        blockId: block.blockId,
        pageId: shared.pageId,
        params: params ?? {},
        urlQuery: shared.urlQuery ?? {},
      },
      endpointDepth: 0,
      literalData: { policyId: policy?.id ?? null },
    });
    if (['error', 'reject'].includes(status)) {
      throw (
        error ??
        new ConfigError(
          `Dynamic block "${block.blockId}" on page "${shared.pageId}" endpoint "${endpointId}" failed with status "${status}".`,
          { configKey: block['~k'] }
        )
      );
    }
    if (!type.isObject(response) || !type.isArray(response.blocks)) {
      throw new ConfigError(
        `Dynamic block "${block.blockId}" on page "${shared.pageId}" endpoint "${endpointId}" must return an object with a "blocks" array.`,
        { received: response, configKey: block['~k'] }
      );
    }
    // Unescape before checking so operator counting validates the real
    // (client-evaluated) operators against the bundle.
    const result = await checkDynamicContent(context, {
      artifacts: shared.artifacts,
      blocks: unescapeOperators(response.blocks),
      dynamicBlockId: block.blockId,
      idPrefix: block.id,
      pageId: shared.pageId,
      pageRequests: shared.pageRequests,
      policy,
      usedTypes: shared.usedTypes,
    });
    if (result.errors.length > 0) {
      throw createContentError({ block, errors: result.errors, pageId: shared.pageId, policy });
    }
    const { blocks, warnings } = result;
    warnings.forEach((warning) => {
      logger.warn(
        { event: 'dynamic_block_warning', blockId: block.blockId, pageId: shared.pageId },
        warning.message
      );
    });
    await resolveBlocks(context, { blocks, depth: depth + 1, shared });
    setResolvedContent(block, blocks);
  } catch (error) {
    if (required === true) {
      // A typed Lowdefy error already carries its own class, message and
      // location - rewrapping it as a ConfigError would misreport a service
      // outage or an authorization refusal as the app developer's config.
      if (error.isLowdefyError) {
        throw error;
      }
      throw new ConfigError(
        `Dynamic block "${block.blockId}" on page "${shared.pageId}" failed to resolve.`,
        { configKey: block['~k'], cause: error }
      );
    }
    logger.error(
      {
        event: 'dynamic_block_error',
        blockId: block.blockId,
        endpointId,
        pageId: shared.pageId,
        err: error,
      },
      `Dynamic block "${block.blockId}" on page "${shared.pageId}" failed to resolve: ${error.message}`
    );
    const fallbackBlocks = block.slots?.fallback?.blocks ?? [];
    setResolvedContent(block, fallbackBlocks);
    await resolveBlocks(context, { blocks: fallbackBlocks, depth: depth + 1, shared });
  }
}

async function resolveDynamicContent(context, { pageConfig, urlQuery }) {
  const [artifacts, pageTypeSets] = await Promise.all([
    loadDynamicArtifacts(context),
    context.readConfigFile('pageTypeSets.json'),
  ]);
  context.evaluateOperators = createEvaluateOperators(context);
  const shared = {
    artifacts,
    pageId: pageConfig.pageId,
    pageRequests: pageConfig.requests ?? [],
    urlQuery,
    usedTypes: { actions: new Set(), blocks: new Set(), operators: new Set() },
  };
  // The page root block itself can be a Dynamic block.
  await resolveBlocks(context, { blocks: [pageConfig], depth: 0, shared });
  flagTypesOutsidePage(context, {
    pageConfig,
    pageTypeSets,
    usedTypes: shared.usedTypes,
  });
  return pageConfig;
}

export default resolveDynamicContent;
