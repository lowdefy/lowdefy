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

import decideSchema from './DecideSchema.js';
import decideWithEvaluation from './decideWithEvaluation.js';
import decideWithStructuredOutput from './decideWithStructuredOutput.js';

// Builds the Decide request resolver for an AI connection: typed questions
// about a state in, typed answers with a confidence out
// (designs/10x #9 — AI decisions as typed config). One interface, two
// backends; `backends` lists what the connection offers, the first being
// the default:
//   evaluation         provider.evaluationModel(id) — the AI Gateway's
//                      evaluation models (TypeSafe's Jev);
//   structured-output  provider(id) — any language model.
function createDecide({ createProvider, backends = ['structured-output'] }) {
  async function Decide({ connection, request }) {
    const provider = createProvider({ connection });
    const backend = request.backend ?? backends[0];
    const options = {};
    if (!type.isNone(request.maxRetries)) options.maxRetries = request.maxRetries;
    if (!type.isNone(request.providerOptions)) options.providerOptions = request.providerOptions;
    const { answers, usage } =
      backend === 'evaluation'
        ? await decideWithEvaluation({
            model: provider.evaluationModel(request.model),
            request,
            options,
          })
        : await decideWithStructuredOutput({ model: provider(request.model), request, options });
    return { ...answers, usage };
  }

  Decide.schema = decideSchema({ backends });
  Decide.meta = {
    checkRead: false,
    checkWrite: false,
  };

  return Decide;
}

export default createDecide;
