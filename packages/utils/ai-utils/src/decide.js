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

import decideWithEvaluation from './decideWithEvaluation.js';
import decideWithStructuredOutput from './decideWithStructuredOutput.js';

// Typed questions about a state in, typed answers with a confidence out, on
// a model the caller already holds. The Decide request resolver runs this
// with its connection's provider; code with no connection or request calls it
// with a model of its own.
//   evaluation         an evaluation model (provider.evaluationModel(id));
//   structured-output  any language model (provider(id)).
// providerMetadata is the AI SDK result's, which carries gateway.cost when
// the AI Gateway reports it.
async function decide({ model, backend, state, questions, options = {} }) {
  if (backend === 'evaluation') {
    return decideWithEvaluation({ model, state, questions, options });
  }
  if (backend === 'structured-output') {
    return decideWithStructuredOutput({ model, state, questions, options });
  }
  throw new Error(
    `decide backend should be "evaluation" or "structured-output". Received ${JSON.stringify(
      backend
    )}.`
  );
}

export default decide;
