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

import readCallCost from './readCallCost.js';

const NEXT_QUESTION =
  'Which interaction most directly exercises what this change added or changed on this page, and has not been tried from this screen?';
const RELEVANCE_QUESTION = {
  score: 'How closely did the last step exercise what this change added or changed?',
  levels: ['unrelated to the change', 'near the change', 'exercises the change'],
};
const MAX_FAILED_CALLS = 3;
const REFUSED_MODEL_ERRORS = ['GatewayModelNotFoundError', 'GatewayForbiddenError'];

function isRefusedModel(error) {
  return (
    REFUSED_MODEL_ERRORS.includes(error?.name) ||
    error?.statusCode === 403 ||
    error?.statusCode === 404
  );
}

// The model-guided policy: one decide() call per step, choosing the next
// option, and on every step but a walk's first scoring how closely the last
// step exercised the change. The model only chooses among generated options;
// it never writes a value or decides a finding. One option is taken without
// asking; none ends the walk (optionId null). An answer outside the options,
// or a call that failed after the backend's retries, falls back to the seeded
// choice and says so; three failed calls in a row throw the Gateway's error.
// An evaluation model the Gateway refuses on the first call throws the
// waitlist message: there is no silent switch between policies.
//
// The Gateway client and ai-utils load here, so no other command pays for
// them. The base URL is the Gateway's default: AI_GATEWAY_BASE_URL is never
// read.
async function createModelPolicy({ backend, modelId, apiKey, seeded }) {
  const [{ decide }, { createGateway }] = await Promise.all([
    import('@lowdefy/ai-utils'),
    import('@ai-sdk/gateway'),
  ]);
  const gateway = createGateway({ apiKey });
  const model = backend === 'evaluation' ? gateway.evaluationModel(modelId) : gateway(modelId);
  let failedCalls = 0;
  let answeredOnce = false;

  async function choose(step) {
    const { state, options, firstStep } = step;
    const optionIds = Object.keys(options);
    if (optionIds.length === 0) return { optionId: null, asked: false };
    if (optionIds.length === 1) return { optionId: optionIds[0], asked: false };
    const questions = { next: { choice: NEXT_QUESTION, options } };
    if (!firstStep) questions.relevance = RELEVANCE_QUESTION;
    let result;
    try {
      result = await decide({ model, backend, state, questions, options: { maxRetries: 2 } });
    } catch (error) {
      if (backend === 'evaluation' && !answeredOnce && isRefusedModel(error)) {
        throw new Error(
          `${modelId} is not available on this key (it is waitlisted); rerun with --policy model`,
          { cause: error }
        );
      }
      failedCalls += 1;
      if (failedCalls >= MAX_FAILED_CALLS) {
        throw error;
      }
      return {
        optionId: seeded.choose(step),
        asked: true,
        fallback: 'failed',
        error: error.message,
      };
    }
    failedCalls = 0;
    answeredOnce = true;
    const { inputTokens, outputTokens, usd, estimated } = readCallCost(result);
    const answer = {
      asked: true,
      relevance: result.answers.relevance?.level ?? null,
      confidence: result.answers.next?.confidence ?? null,
      usage: { inputTokens, outputTokens },
      cost: { usd, estimated },
    };
    const choice = result.answers.next?.choice;
    if (!optionIds.includes(choice)) {
      return { ...answer, optionId: seeded.choose(step), fallback: 'unanswered' };
    }
    return { ...answer, optionId: choice, fallback: null };
  }

  return { name: backend === 'evaluation' ? 'jev' : 'model', backend, modelId, choose };
}

export default createModelPolicy;
