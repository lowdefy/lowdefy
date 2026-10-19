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

// antd 6 folds the deprecated top-level `maskClosable` into the `mask` object. Lowdefy keeps
// `maskClosable` as a property and translates it; `mask.closable` wins when both are set.
function getMask({ mask, maskClosable }) {
  if (mask === false) {
    return false;
  }
  const maskConfig = type.isObject(mask) ? { ...mask } : {};
  if (type.isNone(maskConfig.closable) && !type.isNone(maskClosable)) {
    maskConfig.closable = maskClosable;
  }
  return maskConfig;
}

export default getMask;
