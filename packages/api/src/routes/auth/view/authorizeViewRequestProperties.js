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

import authorizeViewWrite from './authorizeViewWrite.js';

// Aggregation stages that write a collection. A request type that reads can
// still be handed one: MongoDBAggregation declares a read, and on a connection
// that allows writes it runs a pipeline that ends in $out or $merge.
const WRITE_STAGES = ['$out', '$merge'];

function hasWriteStage(value) {
  if (type.isArray(value)) {
    return value.some(hasWriteStage);
  }
  if (!type.isObject(value)) {
    return false;
  }
  return Object.keys(value).some((key) => WRITE_STAGES.includes(key) || hasWriteStage(value[key]));
}

// A request type's meta says what the type does, not what one request of it
// was configured to do. So once a request has passed as a read
// (authorizeViewRequestResolver), its evaluated properties are read too: a
// view session on a read-only grant runs no request that carries a writing
// aggregation stage, at any depth. Refused as a write, with
// view_write_required.
//
// With mcp:write the person's roles and the connection's own write switch
// decide, and a caller that is not a view session is never refused here.
function authorizeViewRequestProperties(context, { requestId, requestProperties }) {
  if (type.isNone(context.viewSession)) {
    return;
  }
  if (!hasWriteStage(requestProperties)) {
    return;
  }
  authorizeViewWrite(context, { subject: `request "${requestId}"` });
}

export default authorizeViewRequestProperties;
