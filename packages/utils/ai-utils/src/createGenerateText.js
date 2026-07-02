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

import handleGenerateText from './handleGenerateText.js';
import schema from './GenerateTextSchema.js';

// Builds the GenerateText request resolver for an AI provider connection.
// createProvider is the only provider-specific piece — request resolvers
// receive evaluated connection properties (not a provider instance) from the
// request interface layer, so the resolver constructs the provider itself.
function createGenerateText({ createProvider }) {
  async function GenerateText({ connection, request }) {
    const provider = createProvider({ connection });
    return handleGenerateText({ model: provider(request.model), request });
  }

  GenerateText.schema = schema;
  GenerateText.meta = {
    checkRead: false,
    checkWrite: false,
  };

  return GenerateText;
}

export default createGenerateText;
