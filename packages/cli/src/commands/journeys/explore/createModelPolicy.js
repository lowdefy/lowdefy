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

import readCallCost from './readCallCost.js';

const NEXT_QUESTION =
  'Which interaction most directly exercises what this change added or changed on this page, and has not been tried from this screen?';
const RELEVANCE_QUESTION = {
  score: 'How closely did the last step exercise what this change added or changed?',
  levels: ['unrelated to the change', 'near the change', 'exercises the change'],
};
// Under a charter (state.charter) the model serves the charter instead.
// A charter can only steer through the options the walk generates, so the
// question names the two stances those options can express.
const CHARTER_NEXT_QUESTION =
  'Which interaction best serves the charter in the state, and has not been tried from this screen? For edge input, prefer the generated edge fill values (empty, long, invalid and the like); for error paths, prefer cancel, delete and submitting incomplete forms.';
const CHARTER_RELEVANCE_QUESTION = {
  score: 'How closely did the last step serve the charter?',
  levels: ['unrelated to the charter', 'near the charter', 'serves the charter'],
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

// A request the model rejects as too big (Jev takes 32k tokens of state and
// question), which no retry of the same request fixes.
function isOverLimit(error) {
  if (error?.statusCode === 413) return true;
  return (
    error?.statusCode === 400 &&
    /context|token|too (long|large)|exceed|limit/i.test(String(error?.message ?? ''))
  );
}

// The model-guided policy: one decide() call per step, choosing the next
// option, and on every step but a walk's first scoring how closely the last
// step exercised the change, or, with a charter, served the charter. The
// model only chooses among generated options; it never writes a value or
// decides a finding, so a charter changes which option is taken and never
// what counts as a finding. One option is taken without
// asking; none ends the walk (optionId null). An answer outside the options,
// or a call that failed after the backend's retries, falls back to the seeded
// choice and says so; three failed calls in a row throw the Gateway's error.
//
// With the evaluation backend (Jev), a structured-output model
// (fallbackModelId) stands by. When the Gateway refuses Jev, at any call, or
// Jev rejects a request as over its limits, the policy switches to it for the
// rest of the run and asks it the same question. The switch is never silent:
// that answer carries fallback 'model', onSwitch is told both model ids and
// the reason, and switched() reports it.
//
// The Gateway client and ai-utils load here, so no other command pays for
// them. The base URL is the Gateway's default: AI_GATEWAY_BASE_URL is never
// read.
async function createModelPolicy({
  charter = null,
  backend,
  modelId,
  fallbackModelId,
  apiKey,
  seeded,
  onSwitch = () => {},
}) {
  const [{ decide }, { createGateway }] = await Promise.all([
    import('@lowdefy/ai-utils'),
    import('@ai-sdk/gateway'),
  ]);
  const nextQuestion = type.isNone(charter) ? NEXT_QUESTION : CHARTER_NEXT_QUESTION;
  const relevanceQuestion = type.isNone(charter) ? RELEVANCE_QUESTION : CHARTER_RELEVANCE_QUESTION;
  const gateway = createGateway({ apiKey });
  let current = {
    backend,
    modelId,
    model: backend === 'evaluation' ? gateway.evaluationModel(modelId) : gateway(modelId),
  };
  const fallback =
    backend === 'evaluation' && !type.isNone(fallbackModelId)
      ? { backend: 'structured-output', modelId: fallbackModelId, model: gateway(fallbackModelId) }
      : null;
  let switched = null;
  let failedCalls = 0;

  async function ask({ state, questions }) {
    try {
      return { result: await callDecide({ state, questions }), fellBack: false };
    } catch (error) {
      const reason = (isRefusedModel(error) && 'refused') || (isOverLimit(error) && 'over-limit');
      if (switched !== null || fallback === null || !reason) throw error;
      switched = { from: current.modelId, to: fallback.modelId, reason, message: error.message };
      current = fallback;
      onSwitch(switched);
      return { result: await callDecide({ state, questions }), fellBack: true };
    }
  }

  function callDecide({ state, questions }) {
    return decide({
      model: current.model,
      backend: current.backend,
      state,
      questions,
      options: { maxRetries: 2 },
    });
  }

  async function choose(step) {
    const { state, options, firstStep } = step;
    const optionIds = Object.keys(options);
    if (optionIds.length === 0) return { optionId: null, asked: false };
    if (optionIds.length === 1) return { optionId: optionIds[0], asked: false };
    const questions = { next: { choice: nextQuestion, options } };
    if (!firstStep) questions.relevance = relevanceQuestion;
    let result;
    let fellBack;
    try {
      ({ result, fellBack } = await ask({ state, questions }));
    } catch (error) {
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
    const { inputTokens, outputTokens, usd, estimated } = readCallCost({
      usage: result.usage,
      providerMetadata: result.providerMetadata,
      state,
      questions,
      modelId: current.modelId,
    });
    const answer = {
      asked: true,
      relevance: result.answers.relevance?.level ?? null,
      confidence: result.answers.next?.confidence ?? null,
      usage: { inputTokens, outputTokens },
      cost: { usd, estimated },
    };
    answer.modelId = current.modelId;
    const choice = result.answers.next?.choice;
    if (!optionIds.includes(choice)) {
      return { ...answer, optionId: seeded.choose(step), fallback: 'unanswered' };
    }
    return { ...answer, optionId: choice, fallback: fellBack ? 'model' : null };
  }

  return {
    name: backend === 'evaluation' ? 'jev' : 'model',
    backend,
    modelId,
    fallbackModelId: fallback?.modelId ?? null,
    lowestRelevance: relevanceQuestion.levels[0],
    switched: () => switched,
    choose,
  };
}

export default createModelPolicy;
