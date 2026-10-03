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

function tokens(value) {
  if (type.isNumber(value)) return value;
  if (type.isNumber(value?.total)) return value.total;
  return 0;
}

// One model call's tokens and cost: the cost the AI Gateway reports in
// providerMetadata.gateway.cost, else an estimate from the tokens at a
// conservative fixed rate, flagged estimated.
function readCallCost({ usage, providerMetadata }) {
  const inputTokens = tokens(usage?.inputTokens);
  const outputTokens = tokens(usage?.outputTokens);
  const reported = Number.parseFloat(providerMetadata?.gateway?.cost);
  if (Number.isFinite(reported)) {
    return { inputTokens, outputTokens, usd: reported, estimated: false };
  }
  return {
    inputTokens,
    outputTokens,
    usd:
      inputTokens * ESTIMATED_INPUT_USD_PER_TOKEN + outputTokens * ESTIMATED_OUTPUT_USD_PER_TOKEN,
    estimated: true,
  };
}

export default readCallCost;
