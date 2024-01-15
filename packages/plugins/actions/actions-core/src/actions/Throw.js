/*
  Copyright 2020-2024 Lowdefy, Inc

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

class ThrowActionError extends Error {
  constructor(message, { blockId, metaData, pageId }) {
    super(message);
    this.blockId = blockId;
    this.metaData = metaData;
    this.name = 'ThrowError';
    this.pageId = pageId;
  }
}

function Throw({ methods: { getBlockId, getPageId }, params }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Throw action params should be an object. Received "${JSON.stringify(params)}".`
    );
  }
  if (!type.isNone(params.throw) && !type.isBoolean(params.throw)) {
    throw new Error(
      `Throw action "throw" param should be an boolean. Received "${JSON.stringify(params.throw)}".`
    );
  }
  if (params.throw === true) {
    throw new ThrowActionError(params.message, {
      blockId: getBlockId(),
      metaData: params.metaData,
      pageId: getPageId(),
    });
  }
}

export default Throw;
export { Throw, ThrowActionError };
