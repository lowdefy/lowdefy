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

// The value-free summary of a failed event, from the { error, action, index } wrapper
// callActions records (or { error } for a control-flow parser error, which has no action).
// Consumers never learn the wrapper shape.
function summariseFailure(wrapper) {
  if (type.isNone(wrapper)) {
    return null;
  }
  const { error, action } = wrapper;
  return {
    actionId: action?.id ?? null,
    actionType: action?.type ?? null,
    configKey: error.configKey ?? action?.['~k'] ?? null,
    errorName: error.name ?? null,
    invalidBlocks: error.invalidBlocks ?? [],
  };
}

export default summariseFailure;
