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

function validateServerStateReferences({ page, context }) {
  (page.requests ?? []).forEach((request) => {
    if (!request.properties) return;
    const str = JSON.stringify(request.properties);
    if (str.indexOf('"_state"') === -1) return;

    const message =
      `_state is not available in request properties. ` +
      `Found _state in request "${request.requestId}" on page "${page.pageId}". ` +
      `Request properties are evaluated on the server where state is not available. ` +
      `To use a state value in a request, add it to the request "payload" using _state, ` +
      `then reference it in request properties using _payload.`;

    context.logger.warn({ message, configKey: request['~k'], prodError: true });
  });
}

export default validateServerStateReferences;
