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

// The run's model spend: calls, tokens and cost, reported and estimated
// (a call the Gateway reports no cost for is charged at readCallCost's
// conservative rate). onFirstEstimate runs once, the first time the cap is
// working from an estimate. exceeded() is true once the spend reaches
// maxCost, so the cap always bounds spend.
function createCostTracker({ maxCost, onFirstEstimate = () => {} }) {
  const totals = {
    calls: 0,
    failedCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    usd: 0,
    estimatedUsd: 0,
  };

  function add(answer) {
    if (answer?.asked !== true) return;
    if (answer.fallback === 'failed') {
      totals.failedCalls += 1;
      return;
    }
    totals.calls += 1;
    totals.inputTokens += answer.usage?.inputTokens ?? 0;
    totals.outputTokens += answer.usage?.outputTokens ?? 0;
    const usd = answer.cost?.usd ?? 0;
    totals.usd += usd;
    if (answer.cost?.estimated === true) {
      if (totals.estimatedUsd === 0) onFirstEstimate();
      totals.estimatedUsd += usd;
    }
  }

  return {
    add,
    exceeded: () => totals.usd >= maxCost,
    totals: () => ({ ...totals }),
  };
}

export default createCostTracker;
