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

// Whether a request only reads, so the client may send it again when the host
// fails it before the app answers. Its type's plugin must say it never writes
// (requestMetas), and a pipeline must be a literal list with no $out or $merge
// stage: one built by an operator could write. A type without metadata is
// not read-only.
function isReadOnlyRequest({ request, requestMetas }) {
  if (requestMetas?.[request.type]?.checkWrite !== false) {
    return false;
  }
  const pipeline = request.properties?.pipeline;
  if (type.isUndefined(pipeline)) {
    return true;
  }
  if (!type.isArray(pipeline)) {
    return false;
  }
  return !pipeline.some(
    (stage) =>
      !type.isObject(stage) || !type.isUndefined(stage.$out) || !type.isUndefined(stage.$merge)
  );
}

export default isReadOnlyRequest;
