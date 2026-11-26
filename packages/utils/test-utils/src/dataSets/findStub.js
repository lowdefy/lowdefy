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

import compareValues from '../assert/compareValues.js';
import matchesRequestKey from './matchesRequestKey.js';

// The first stub on the session that answers a request, by its record (describeSunkRequest):
// same connection and request type, the request key it narrows by, and `match`, a partial match
// on the request properties as sunk records them. Undefined when none does.
function findStub({ record, session }) {
  return session.stubs.find(
    (stub) =>
      stub.connectionType === record.connectionType &&
      stub.requestType === record.requestType &&
      matchesRequestKey({ entry: stub, request: record }) &&
      (type.isUndefined(stub.match) ||
        compareValues({ actual: record.request, expected: stub.match, partial: true, path: [] }) ===
          null)
  );
}

export default findStub;
