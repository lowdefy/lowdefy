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

// The state one walk shares across every block it visits: the renderer
// registry, the per-block report options, the render context handed to every
// renderer, and the two collectors. Unsupported types are collected once per
// type listing every blockId, so a page with ten unrenderable widgets warns ten
// blockIds under one type; failures the same, with the first error message.
function createWalkState({ registry, reportOptions, context }) {
  const unsupported = new Map();
  const failed = new Map();
  const logger = context.logger;

  function recordUnsupported(block) {
    if (!unsupported.has(block.type)) {
      unsupported.set(block.type, new Set());
    }
    unsupported.get(block.type).add(block.blockId);
  }

  function recordFailure(block, error) {
    if (!failed.has(block.type)) {
      failed.set(block.type, { blockIds: new Set(), message: error.message });
    }
    failed.get(block.type).blockIds.add(block.blockId);
    if (type.isFunction(logger?.warn)) {
      logger.warn(
        { blockId: block.blockId, blockType: block.type, err: error },
        `Report renderer for block '${block.blockId}' (${block.type}) threw; block skipped: ${error.message}`
      );
    }
  }

  function optionsFor(block) {
    return reportOptions[block.blockId] ?? reportOptions[block.blockIdPattern] ?? {};
  }

  function summary() {
    return {
      warnings: [...unsupported.entries()].map(([blockType, blockIds]) => ({
        blockType,
        blockIds: [...blockIds],
      })),
      renderErrors: [...failed.entries()].map(([blockType, { blockIds, message }]) => ({
        blockType,
        blockIds: [...blockIds],
        message,
      })),
    };
  }

  return {
    context,
    logger,
    optionsFor,
    recordFailure,
    recordUnsupported,
    registry,
    signal: context.signal,
    summary,
  };
}

export default createWalkState;
