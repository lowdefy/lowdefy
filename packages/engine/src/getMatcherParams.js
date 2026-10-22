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

import { applyArrayIndices, type } from '@lowdefy/helpers';

// The params Validate and ResetValidation take, as { blockIds, regex }: blockIds is true, false, an
// array of ids with the action's list-row "$" applied, or undefined; regex is an array of RegExp or
// undefined. Returns null for no params, which matches every block.
function getMatcherParams({ params, arrayIndices }) {
  if (type.isNone(params)) return null;
  let matcherParams = params;
  if (type.isString(matcherParams)) {
    matcherParams = { blockIds: [matcherParams] };
  }
  if (type.isArray(matcherParams) || type.isBoolean(matcherParams)) {
    matcherParams = { blockIds: matcherParams };
  }
  if (!type.isObject(matcherParams)) {
    throw new Error('Invalid validate params.');
  }
  let { blockIds, regex } = matcherParams;
  if (type.isString(blockIds)) {
    blockIds = [blockIds];
  }
  // An action in a list row names its row's blocks as "list.$.field", like SetState and CallMethod.
  if (type.isArray(blockIds)) {
    blockIds = blockIds.map((blockId) => applyArrayIndices(arrayIndices, blockId));
  }
  if (type.isString(regex)) {
    regex = [regex];
  }
  if (type.isArray(regex)) {
    regex = regex.map((pattern) => new RegExp(pattern));
  }
  return { blockIds, regex };
}

export default getMatcherParams;
