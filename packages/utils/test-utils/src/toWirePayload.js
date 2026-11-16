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

// A payload as it reaches the server: the client serializes it (dates and other typed values
// become markers), posts it as JSON, and the route parses the body. A value JSON cannot carry
// (undefined, a function, a class instance's prototype) is lost here as it is over HTTP, so a
// test cannot pass an endpoint something a client could not send.
function toWirePayload({ payload, testApp }) {
  const { parseRequestBody } = testApp.modules.api;
  const { serializer } = testApp.modules.helpers;
  const text = JSON.stringify({ payload: serializer.serialize(payload ?? {}) });
  return parseRequestBody({ text }).payload;
}

export default toWirePayload;
