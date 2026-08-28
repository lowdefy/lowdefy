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

async function invokeEndpoint({ endpoint, input }) {
  try {
    return await endpoint(input);
  } catch (error) {
    // Surface BetterAuth APIError rail messages (validation, ROLE_NOT_FOUND, etc.)
    // verbatim - the step interface layer wraps further.
    if (!type.isNone(error.status) && !type.isNone(error.body)) {
      throw new Error(error.body?.message ?? error.body?.code ?? error.message, { cause: error });
    }
    throw error;
  }
}

export default invokeEndpoint;
