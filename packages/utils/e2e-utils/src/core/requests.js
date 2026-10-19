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

import pageContextExpression from './instanceKey.js';

async function getRequestState(page, requestId) {
  return page.evaluate(
    ({ reqId, getContext }) => new Function(`return ${getContext}`)()?.requests?.[reqId]?.[0],
    { reqId: requestId, getContext: pageContextExpression }
  );
}

async function getRequestResponse(page, { requestId }) {
  const state = await getRequestState(page, requestId);
  return state?.response;
}

export { getRequestState, getRequestResponse };
