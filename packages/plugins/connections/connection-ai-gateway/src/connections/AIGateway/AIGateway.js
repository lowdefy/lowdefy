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

import { createDecide, createGenerateObject, createGenerateText } from '@lowdefy/ai-utils';

import createProvider from './createProvider.js';
import schema from './schema.js';

// maxOutputTokens and timeout are defaults for the agents on this connection; the
// request resolvers read them from the connection properties.
function create({ connection }) {
  const { maxOutputTokens, timeout } = connection ?? {};
  return { provider: createProvider({ connection }), maxOutputTokens, timeout };
}

const AIGateway = {
  schema,
  create,
  requests: {
    // Evaluation models (TypeSafe's Jev) answer by default; any language model
    // on the gateway can with backend: structured-output.
    Decide: createDecide({ createProvider, backends: ['evaluation', 'structured-output'] }),
    GenerateObject: createGenerateObject({ createProvider }),
    GenerateText: createGenerateText({ createProvider }),
  },
};
export default AIGateway;
