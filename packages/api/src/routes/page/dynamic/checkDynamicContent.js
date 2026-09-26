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

import checkPolicy from './policy/checkPolicy.js';
import validateFragment from './validateFragment.js';

// The one checker behind both the ValidateDynamic step and page get. Policy
// rules run first on the content as submitted and collect every violation;
// when they pass, the content goes through the same block build and fragment
// validation every Dynamic block gets. Returns { errors } on failure, or the
// built fragment. buildBlock mutates the content, so callers pass their own copy.
async function checkDynamicContent(
  context,
  { artifacts, blocks, dynamicBlockId, idPrefix, pageId, pageRequests, policy, usedTypes }
) {
  if (policy) {
    const errors = checkPolicy({
      blocks,
      policy,
      blockMetas: artifacts.blockMetas,
      blockSchemas: artifacts.blockSchemas,
    });
    if (errors.length > 0) {
      return { errors };
    }
  }
  try {
    const built = artifacts.buildDynamicBlocks({
      blocks,
      pageId,
      dynamicBlockId,
      idPrefix,
      types: artifacts.types,
      blockMetas: artifacts.blockMetas,
      dynamicPolicies: artifacts.dynamicPolicies,
      policy,
      usedTypes,
    });
    await validateFragment(context, {
      blocks: built.blocks,
      blockSchemas: artifacts.blockSchemas,
      callApiActionRefs: built.callApiActionRefs,
      dynamicBlockId,
      pageId,
      pageRequests,
      requestActionRefs: built.requestActionRefs,
    });
    return { errors: [], ...built };
  } catch (error) {
    if (!(error instanceof ConfigError)) {
      throw error;
    }
    return { errors: [{ path: 'blocks', rule: 'build', message: error.message, cause: error }] };
  }
}

export default checkDynamicContent;
