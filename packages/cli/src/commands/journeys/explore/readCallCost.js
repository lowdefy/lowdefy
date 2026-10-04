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

// Charged for a call whose cost the Gateway does not report: well above the
// cheap models the explorer targets, so the spending cap always holds.
const ESTIMATED_INPUT_USD_PER_TOKEN = 1 / 1_000_000;
const ESTIMATED_OUTPUT_USD_PER_TOKEN = 4 / 1_000_000;
// Models with a published price, charged at it when the Gateway reports no
// cost (an evaluation call may not), so the cap is not overstated 24 times.
const PUBLISHED_RATES = {
  'typesafe-ai/jev': { input: 0.042 / 1_000_000, output: 0 },
};
// Tokens charged per question when the backend reports no token counts
// either: a question is about 3-4k input tokens and a few dozen output.
// Without this floor an uncounted call costs nothing and --max-cost never
// trips.
const FLOOR_INPUT_TOKENS_PER_QUESTION = 4000;
const FLOOR_OUTPUT_TOKENS_PER_QUESTION = 50;
const CHARACTERS_PER_TOKEN = 4;

function reportedTokens(value) {
  if (type.isNumber(value)) return value;
  if (type.isNumber(value?.total)) return value.total;
  return null;
}

function floorInputTokens({ state, questions }) {
  const promptTokens = Math.ceil(
    JSON.stringify({ state, questions }).length / CHARACTERS_PER_TOKEN
  );
  return Math.max(promptTokens, Object.keys(questions).length * FLOOR_INPUT_TOKENS_PER_QUESTION);
}

// One model call's tokens and cost: the cost the AI Gateway reports in
// providerMetadata.gateway.cost, else an estimate from the tokens, flagged
// estimated: at the model's published rate when it has one, else at a
// conservative fixed rate. A token count the backend does
// not report is estimated from the prompt (state and questions) at four
// characters a token, and never below the per-question floor. The returned
// token counts are only what the backend reported.
function readCallCost({ usage, providerMetadata, state, questions, modelId }) {
  const inputTokens = reportedTokens(usage?.inputTokens);
  const outputTokens = reportedTokens(usage?.outputTokens);
  const reported = {
    inputTokens: inputTokens ?? 0,
    outputTokens: outputTokens ?? 0,
  };
  const reportedCost = Number.parseFloat(providerMetadata?.gateway?.cost);
  if (Number.isFinite(reportedCost)) {
    return { ...reported, usd: reportedCost, estimated: false };
  }
  const chargedInputTokens = inputTokens ?? floorInputTokens({ state, questions });
  const chargedOutputTokens =
    outputTokens ?? Object.keys(questions).length * FLOOR_OUTPUT_TOKENS_PER_QUESTION;
  const rate = PUBLISHED_RATES[modelId] ?? {
    input: ESTIMATED_INPUT_USD_PER_TOKEN,
    output: ESTIMATED_OUTPUT_USD_PER_TOKEN,
  };
  return {
    ...reported,
    usd: chargedInputTokens * rate.input + chargedOutputTokens * rate.output,
    estimated: true,
  };
}

export default readCallCost;
