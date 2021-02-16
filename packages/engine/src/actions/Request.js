/*
  Copyright 2020-2021 Lowdefy, Inc

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

async function Request({ arrayIndices, context, event, params }) {
  if (type.isNone(params)) {
    // Should this resolve or error
    return Promise.resolve();
  }
  let requestIds = [];
  if (params.all === true) requestIds = undefined;
  if (type.isString(params)) requestIds = [params];
  if (type.isArray(params)) requestIds = params;

  let response;
  try {
    response = await context.Requests.callRequests({ requestIds, event, arrayIndices });
  } catch (error) {
    let graphQLMessage;
    try {
      const { displayTitle, displayMessage } = error.graphQLErrors[0].extensions;
      graphQLMessage = `${displayTitle}: ${displayMessage}`;
    } catch (e) {
      // Not a graphQLError, displayTitle, displayMessage do not exist
    }
    throw new Error(graphQLMessage || error.message);
  }

  return response;
}

export default Request;
