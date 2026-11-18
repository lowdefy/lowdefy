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

// A journey's answer stub (addJourneyStubs) in words, by its connection and request type and
// what narrows it: 'AxiosHttp/AxiosHttp stub', or 'AxiosHttp/AxiosHttp stub on request "x"
// and endpoint "y"', with `match` as JSON, for a report of a stub that never answered.
function describeAnswerStub(stub) {
  const narrowing = [];
  if (!type.isNone(stub.requestId)) {
    narrowing.push(`request "${stub.requestId}"`);
  }
  if (!type.isNone(stub.endpoint)) {
    narrowing.push(`endpoint "${stub.endpoint}"`);
  }
  if (!type.isNone(stub.pageId)) {
    narrowing.push(`page "${stub.pageId}"`);
  }
  if (!type.isUndefined(stub.match)) {
    narrowing.push(`match ${JSON.stringify(stub.match)}`);
  }
  const name = `${stub.connectionType}/${stub.requestType} stub`;
  return narrowing.length === 0 ? name : `${name} on ${narrowing.join(' and ')}`;
}

export default describeAnswerStub;
